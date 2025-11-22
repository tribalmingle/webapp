import { expect, test } from '@playwright/test'

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

test.describe('Discovery surfaces', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.prompt = () => 'Evenings'
    })

    await page.route('**/api/discover', async (route) => {
      await route.fulfill({ json: { success: true, data: mockFeed } })
    })
    await page.route('**/api/boosts/strip', (route) => route.fulfill({ json: { success: true, data: mockBoostStrip } }))
    await page.route('**/api/analytics/track', (route) => route.fulfill({ json: { success: true } }))
    await page.route('**/api/discover/recipes', (route) => route.fulfill({ json: { success: true, data: { _id: 'recipe-1' } } }))

    await page.goto('/discover')
  })

  test('switches between swipe and story mode', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Story grid' })).toBeVisible()
    await page.getByRole('button', { name: 'Story grid' }).click()
    await expect(page.getByText('Lagos experiences')).toBeVisible()
    await page.getByRole('button', { name: 'Swipe stack' }).click()
    await expect(page.getByText('Opener:', { exact: false })).toBeVisible()
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
