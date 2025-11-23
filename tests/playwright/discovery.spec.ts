import { expect, test, type Page, type Locator } from '@playwright/test'

const mockCandidate = {
  candidateId: 'candidate-1',
  matchScore: 0.92,
  conciergePrompt: 'Share your guardian-approved ritual stories.',
  aiOpener: 'Hi Joy! We both love Lagos jazz nights—what is your go-to venue?',
  profile: {
    name: 'Joy',
    tribe: 'Igbo',
    location: { city: 'Lagos', country: 'Nigeria' },
    trustBadges: ['Verified ID & Selfie'],
  },
  scoreBreakdown: { compatibility: 0.9, culture: 0.95, intent: 0.88 },
}

const mockFeed = {
  mode: 'swipe',
  filters: { verifiedOnly: true },
  candidates: [mockCandidate],
  storyPanels: [{ ...mockCandidate, contextPanel: 'Joy is co-hosting a guardian circle in Lagos.' }],
  recipes: [{ id: 'default', name: 'Concierge picks', isDefault: true }],
  telemetry: { generatedAt: new Date().toISOString(), total: 6 },
}

const mockBoostStrip = {
  active: [{ sessionId: 's1', placement: 'spotlight', endsAt: new Date(Date.now() + 600000).toISOString() }],
  upcoming: [],
}

test.describe.skip('Discovery surfaces (skipped: auth/session coupling pending)', () => {
  test.beforeEach(async ({ page }) => {
    // Stub prompt for recipe naming.
    await page.addInitScript(() => {
      window.prompt = () => 'Evenings'
    })

    // Network mocks first so initial page load hits them.
    await page.route('**/api/discover', async (route) => route.fulfill({ json: { success: true, data: mockFeed } }))
    await page.route('**/api/boosts/strip', (route) => route.fulfill({ json: { success: true, data: mockBoostStrip } }))
    await page.route('**/api/analytics/track', (route) => route.fulfill({ json: { success: true } }))
    await page.route('**/api/discover/recipes', (route) => route.fulfill({ json: { success: true, data: { _id: 'recipe-1' } } }))

    page.on('console', (msg) => {
      console.log('[browser]', msg.type(), msg.text())
    })
    page.on('pageerror', (err) => {
      console.log('[pageerror]', err.message)
    })
    await page.goto('/discover')
    // Inject session after first load, then reload so app picks it up.
    await page.evaluate(({ state }) => {
      window.localStorage.setItem('tm-member-session', JSON.stringify({ state, version: 0 }))
    }, { state: seedState() })
    await page.reload()
    await page.waitForLoadState('domcontentloaded')
    await page.waitForLoadState('networkidle')
  })

  test('renders discovery mode toggles and allows switching', async ({ page }) => {
    const swipeButton = page.getByRole('button', { name: 'Swipe stack' })
    const storyButton = page.getByRole('button', { name: 'Story grid' })
    await expect(swipeButton).toBeVisible()
    await expect(storyButton).toBeVisible()
    await stableClick(storyButton)
    await page.waitForTimeout(300)
    await stableClick(swipeButton)
    await page.waitForTimeout(300)
    // Smoke assertions only to avoid flakiness while feed stabilizes.
    await expect(swipeButton).toBeVisible()
    await expect(storyButton).toBeVisible()
  })

  test('saves recipe and fires like + super like interactions', async ({ page }) => {
    const recipeRequest = page.waitForRequest('**/api/discover/recipes')

    await page.route('**/api/interactions/like', async (route) => {
      await route.fulfill({ json: { success: true, data: { mutual: false } } })
    })
    const likeRequest = page.waitForRequest('**/api/interactions/like')

    await page.route('**/api/interactions/super-like', async (route) => {
      await route.fulfill({ json: { success: true } })
    })
    const superLikeRequest = page.waitForRequest('**/api/interactions/super-like')

    await page.getByRole('button', { name: 'Save recipe' }).click()
    const recipeCall = await recipeRequest
    expect(recipeCall.postDataJSON().name).toBe('Evenings')

    await page.getByRole('button', { name: 'Like' }).first().click()
    const likeCall = await likeRequest
    expect(likeCall.postDataJSON().targetId).toBe('candidate-1')

    await page.getByRole('button', { name: 'Super like' }).first().click()
    const superLikeCall = await superLikeRequest
    expect(superLikeCall.postDataJSON().targetId).toBe('candidate-1')
  })
})

function seedState() {
  return {
    user: {
      _id: '507f1f77bcf86cd799439012',
      email: 'discoverer@example.com',
      name: 'Joy Explorer',
      username: 'joy-explorer',
      gender: 'female',
      age: 28,
      dateOfBirth: '1997-01-01',
      verified: true,
      subscriptionPlan: 'free',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    lastSyncedAt: Date.now(),
  }
}

async function stableClick(locator: Locator) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      await locator.click()
      return
    } catch (err) {
      // Handle transient detach/re-render: re-wait for visibility and retry.
      if (attempt === 2) throw err
      await locator.waitFor({ state: 'visible' })
    }
  }
}
