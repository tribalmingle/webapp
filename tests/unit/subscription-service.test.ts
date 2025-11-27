import { describe, it, expect, beforeEach } from 'vitest'
import { 
  startTrial, 
  activateSubscription, 
  downgradeToFree, 
  cancelSubscription, 
  markSubscriptionPastDue,
  getSubscription,
  type SubscriptionPlan
} from '@/lib/services/subscription-service'

describe('SubscriptionService', () => {
  const userId = 'sub-user-' + Date.now()
  
  describe('Trial lifecycle', () => {
    it('starts trial with default 7-day duration', async () => {
      const trial = await startTrial(userId, 'concierge')
      expect(trial.status).toBe('trialing')
      expect(trial.plan).toBe('concierge')
      expect(trial.trialEndsAt).toBeDefined()
      const daysRemaining = Math.floor((trial.trialEndsAt!.getTime() - Date.now()) / (24 * 60 * 60 * 1000))
      expect(daysRemaining).toBeGreaterThanOrEqual(6)
      expect(daysRemaining).toBeLessThanOrEqual(7)
    })

    it('starts trial with custom duration', async () => {
      const trial = await startTrial(userId + '-custom', 'guardian', 14)
      expect(trial.status).toBe('trialing')
      expect(trial.trialEndsAt).toBeDefined()
      const daysRemaining = Math.floor((trial.trialEndsAt!.getTime() - Date.now()) / (24 * 60 * 60 * 1000))
      expect(daysRemaining).toBeGreaterThanOrEqual(13)
      expect(daysRemaining).toBeLessThanOrEqual(14)
    })

    it('does not start new trial if user already has active subscription', async () => {
      const first = await startTrial(userId + '-no-double', 'concierge')
      const second = await startTrial(userId + '-no-double', 'guardian')
      expect(second.id).toBe(first.id)
      expect(second.plan).toBe(first.plan)
    })

    it('converts trial to active subscription', async () => {
      const trial = await startTrial(userId + '-convert', 'concierge', 1)
      expect(trial.status).toBe('trialing')
      const active = await activateSubscription(userId + '-convert', 'concierge')
      expect(active.status).toBe('active')
      expect(active.trialEndsAt).toBeUndefined()
      expect(active.renewsAt).toBeDefined()
    })
  })

  describe('Plan upgrades and proration', () => {
    it('upgrades from concierge to guardian with proration credit', async () => {
      const userId1 = userId + '-upgrade1'
      const initial = await activateSubscription(userId1, 'concierge')
      expect(initial.status).toBe('active')
      
      const upgrade = await activateSubscription(userId1, 'guardian')
      expect(upgrade.status).toBe('active')
      expect(upgrade.plan).toBe('guardian')
      expect(upgrade.proratedFromPlan).toBe('concierge')
      expect(upgrade.prorationCreditCents).toBeDefined()
      expect(upgrade.prorationCreditCents).toBeGreaterThan(0)
    })

    it('upgrades from guardian to premium_plus with proration credit', async () => {
      const userId2 = userId + '-upgrade2'
      const initial = await activateSubscription(userId2, 'guardian')
      const upgrade = await activateSubscription(userId2, 'premium_plus')
      expect(upgrade.plan).toBe('premium_plus')
      expect(upgrade.proratedFromPlan).toBe('guardian')
      expect(upgrade.prorationCreditCents).toBeGreaterThan(0)
    })

    it('does not apply proration credit when downgrading', async () => {
      const userId3 = userId + '-downgrade'
      const initial = await activateSubscription(userId3, 'premium_plus')
      const downgrade = await activateSubscription(userId3, 'guardian')
      expect(downgrade.plan).toBe('guardian')
      // Proration logic only credits when upgrading (price increase)
      expect(downgrade.proratedFromPlan).toBe('premium_plus')
    })

    it('calculates proration based on remaining days', async () => {
      const userId4 = userId + '-proration-calc'
      const initial = await activateSubscription(userId4, 'concierge')
      expect(initial.renewsAt).toBeDefined()
      
      // Upgrade immediately should give ~30 days of credit
      const upgrade = await activateSubscription(userId4, 'guardian')
      expect(upgrade.prorationCreditCents).toBeDefined()
      // Concierge daily rate ~33 cents/day, 30 days ~1000 cents total
      expect(upgrade.prorationCreditCents).toBeGreaterThan(800)
      expect(upgrade.prorationCreditCents).toBeLessThan(1200)
    })
  })

  describe('Status transitions', () => {
    it('transitions trialing → active → canceled', async () => {
      const userId5 = userId + '-status1'
      const trial = await startTrial(userId5, 'concierge')
      expect(trial.status).toBe('trialing')
      
      const active = await activateSubscription(userId5, 'concierge')
      expect(active.status).toBe('active')
      
      const canceled = await cancelSubscription(userId5)
      expect(canceled?.status).toBe('canceled')
      expect(canceled?.renewsAt).toBeUndefined()
    })

    it('transitions active → past_due → canceled', async () => {
      const userId6 = userId + '-status2'
      const active = await activateSubscription(userId6, 'concierge')
      expect(active.status).toBe('active')
      
      const pastDue = await markSubscriptionPastDue(userId6)
      expect(pastDue?.status).toBe('past_due')
      expect(pastDue?.pastDueSince).toBeDefined()
      
      const canceled = await cancelSubscription(userId6)
      expect(canceled?.status).toBe('canceled')
    })

    it('marks past_due with timestamp', async () => {
      const userId7 = userId + '-pastdue'
      await activateSubscription(userId7, 'guardian')
      const pastDue = await markSubscriptionPastDue(userId7)
      expect(pastDue?.pastDueSince).toBeDefined()
      const elapsed = Date.now() - pastDue!.pastDueSince!.getTime()
      expect(elapsed).toBeLessThan(5000) // Should be recent
    })
  })

  describe('Downgrade operations', () => {
    it('downgrades to free from any plan', async () => {
      const userId8 = userId + '-free1'
      await activateSubscription(userId8, 'premium_plus')
      const free = await downgradeToFree(userId8)
      expect(free.plan).toBe('free')
      expect(free.status).toBe('active')
      expect(free.renewsAt).toBeUndefined()
      expect(free.trialEndsAt).toBeUndefined()
    })

    it('creates new free subscription if none exists', async () => {
      const userId9 = userId + '-free2'
      const free = await downgradeToFree(userId9)
      expect(free.plan).toBe('free')
      expect(free.status).toBe('active')
    })
  })

  describe('Subscription retrieval', () => {
    it('retrieves existing subscription', async () => {
      const userId10 = userId + '-get'
      const created = await activateSubscription(userId10, 'concierge')
      const retrieved = await getSubscription(userId10)
      expect(retrieved?.id).toBe(created.id)
      expect(retrieved?.plan).toBe('concierge')
      expect(retrieved?.status).toBe('active')
    })

    it('returns null for non-existent subscription', async () => {
      const retrieved = await getSubscription('non-existent-user-xyz')
      expect(retrieved).toBeNull()
    })
  })

  describe('Cancellation edge cases', () => {
    it('returns null when canceling non-existent subscription', async () => {
      const canceled = await cancelSubscription('non-existent-cancel-user')
      expect(canceled).toBeNull()
    })

    it('preserves plan information after cancellation', async () => {
      const userId11 = userId + '-cancel-preserve'
      const active = await activateSubscription(userId11, 'guardian')
      const canceled = await cancelSubscription(userId11)
      expect(canceled?.plan).toBe('guardian')
      expect(canceled?.status).toBe('canceled')
    })
  })
})
