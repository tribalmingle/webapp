import { expect, test, type Page } from '@playwright/test'

const DEFAULT_INBOX_PREFERENCES = {
  folder: 'spark',
  showPinned: true,
  palette: {
    spark: 'from-pink-500/20 to-orange-500/20',
    active: 'from-primary/10 to-primary/5',
    snoozed: 'from-muted/40 to-muted/10',
    trust: 'from-amber-500/20 to-red-500/10',
    all: 'from-slate-100 to-slate-50',
  },
  filters: {
    unreadOnly: false,
    verifiedOnly: false,
    translatorOnly: false,
    query: '',
  },
}

const MOCK_AR_FILTERS = [
  { id: 'aurora', name: 'Aurora Bloom', description: 'Sunset gradients for calm vibes.', previewUrl: '/filters/aurora' },
  { id: 'kinetic', name: 'Kinetic Pulse', description: 'Animated glyphs for live salons.', previewUrl: '/filters/kinetic' },
]

test.describe('Messaging inbox', () => {
  test.beforeEach(async ({ page }) => {
    await registerNetworkMocks(page)
  })

  test('renders segmented folders and translator indicators', async ({ page }) => {
    await seedSession(page, 'free')
    await page.goto('/chat')

    await expect(page.getByRole('link', { name: /Emma Johnson/ })).toBeVisible()
    await expect(page.getByRole('link', { name: /Michelle Park/ })).toBeVisible()
    await expect(page.getByText('Translator ready').first()).toBeVisible()

    await expect(page.getByRole('link', { name: /Rachel Anderson/ })).toHaveCount(0)
    await page.getByRole('button', { name: 'All' }).click()
    await expect(page.getByRole('link', { name: /Rachel Anderson/ })).toBeVisible()
    await expect(page.getByRole('link', { name: /Trust Ops/ })).toBeVisible()
  })

  test('applies query + verified filters and gates translator toggle for free members', async ({ page }) => {
    await seedSession(page, 'free')
    await page.goto('/chat')
    await page.getByRole('button', { name: 'All' }).click()

    const notificationsTrigger = page.getByRole('button', { name: 'Notifications menu' })
    await notificationsTrigger.click()

    const translatorSwitch = page.getByRole('switch', { name: 'Translator-ready' })
    await expect(translatorSwitch).toBeDisabled()
    await expect(page.getByText('Premium required')).toBeVisible()

    const verifiedSwitch = page.getByRole('switch', { name: 'Verified profiles only' })
    await verifiedSwitch.click()
    await page.keyboard.press('Escape')

    await expect(page.getByRole('link', { name: /Michelle Park/ })).toHaveCount(0)
    await expect(page.getByRole('link', { name: /Trust Ops/ })).toHaveCount(0)

    await notificationsTrigger.click()
    const verifiedResetSwitch = page.getByRole('switch', { name: 'Verified profiles only' })
    await verifiedResetSwitch.click()
    const inboxSearch = page.getByPlaceholder('Search by name or intention')
    await inboxSearch.fill('Trust Ops')
    await page.keyboard.press('Escape')

    await expect(page.getByRole('link', { name: /Trust Ops/ })).toBeVisible()
    await expect(page.getByRole('link', { name: /Emma Johnson/ })).toHaveCount(0)
  })

  test('allows premium members to filter for translator-ready chats', async ({ page }) => {
    await seedSession(page, 'monthly')
    await page.goto('/chat')
    await page.getByRole('button', { name: 'All' }).click()

    await page.getByRole('button', { name: 'Notifications menu' }).click()
    const translatorSwitch = page.getByRole('switch', { name: 'Translator-ready' })
    await expect(translatorSwitch).toBeEnabled()
    await translatorSwitch.click()
    await page.keyboard.press('Escape')

    await expect(page.getByRole('link', { name: /Emma Johnson/ })).toBeVisible()
    await expect(page.getByRole('link', { name: /Michelle Park/ })).toBeVisible()
    await expect(page.getByRole('link', { name: /Jessica Chen/ })).toHaveCount(0)
    await expect(page.getByRole('link', { name: /Trust Ops/ })).toHaveCount(0)
  })
})

async function seedSession(page: Page, subscriptionPlan = 'free') {
  const sessionState = {
    user: {
      _id: '507f1f77bcf86cd799439011',
      email: 'member@example.com',
      name: 'Ama Member',
      username: 'ama-member',
      gender: 'female',
      age: 29,
      dateOfBirth: '1995-01-01',
      verified: true,
      subscriptionPlan,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    lastSyncedAt: Date.now(),
    inboxPreferences: clonePreferences(),
  }

  await page.addInitScript(({ state }: { state: unknown }) => {
    window.localStorage.setItem('tm-member-session', JSON.stringify({ state, version: 0 }))
  }, { state: sessionState })
}

async function registerNetworkMocks(page: Page) {
  await page.route('**/api/chat/ar-filters', (route) => route.fulfill({ json: { success: true, filters: MOCK_AR_FILTERS } }))
  await page.route('**/api/chat/threads/preferences', (route) => route.fulfill({ json: { success: true } }))
  await page.route('**/api/analytics/track', (route) => route.fulfill({ json: { success: true } }))
}

function clonePreferences() {
  return JSON.parse(JSON.stringify(DEFAULT_INBOX_PREFERENCES))
}
