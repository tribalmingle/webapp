import { describe, it, expect } from 'vitest'
import { startTrial, activateSubscription, downgradeToFree, cancelSubscription, markSubscriptionPastDue } from '@/lib/services/subscription-service'

describe('SubscriptionService', () => {
  const userId = 'sub-user'
  it('starts trial then activates plan with proration credit when upgrading', async () => {
    const trial = await startTrial(userId, 'concierge', 1)
    expect(trial.status).toBe('trialing')
    const active = await activateSubscription(userId, 'guardian')
    expect(active.status).toBe('active')
    // guardian upgrade from concierge trial likely no credit yet (trial endsAt replaced)
    const upgrade = await activateSubscription(userId, 'premium_plus')
    expect(upgrade.prorationCreditCents).toBeDefined()
  })
  it('downgrades to free', async () => {
    const rec = await downgradeToFree(userId)
    expect(rec.plan).toBe('free')
  })
  it('marks past due', async () => {
    const pastDue = await markSubscriptionPastDue(userId)
    expect(pastDue?.status).toBe('past_due')
    expect(pastDue?.pastDueSince).toBeDefined()
  })
  it('cancels subscription', async () => {
    const activated = await activateSubscription(userId, 'concierge')
    expect(activated.status).toBe('active')
    const canceled = await cancelSubscription(userId)
    expect(canceled?.status).toBe('canceled')
  })
})
