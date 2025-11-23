import { expect, test } from '@playwright/test'

const mockEvents = [
  {
    id: 'event-1',
    slug: 'culture-night',
    title: 'Culture Night Lagos',
    description: 'Guardian-led conversation with live percussion.',
    startAt: new Date(Date.now() + 3600 * 1000).toISOString(),
    endAt: new Date(Date.now() + 7200 * 1000).toISOString(),
    timezone: 'Africa/Lagos',
    tribe: 'Afropolitan',
    tags: ['music', 'guardian'],
    location: { type: 'in_person', city: 'Lagos', country: 'NG' },
    ticketing: { priceCents: 0, currency: 'USD', provider: 'none' },
    capacity: 30,
    waitlistEnabled: true,
    attendeeCount: 12,
    waitlistCount: 0,
    seatsRemaining: 18,
  },
]

test.describe('Events hub', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/events**', (route) => route.fulfill({ json: { success: true, data: mockEvents } }))
    await page.route('**/api/events/event-1/register', (route) => route.fulfill({ json: { success: true, data: { status: 'confirmed', paymentStatus: 'none' } } }))
    await page.goto('/events')
  })

  test('lists upcoming events and RSVP flow', async ({ page }) => {
    await expect(page.getByText('Culture Night Lagos')).toBeVisible()
    await page.getByRole('button', { name: 'RSVP' }).click()
    await expect(page.getByText('You are in')).toBeVisible()
    await expect(page.getByRole('link', { name: 'Details' })).toHaveAttribute('href', '/events/culture-night')
  })
})
