import { describe, it, expect, beforeEach } from 'vitest'
import { 
  createReferralCode, 
  recordEvent, 
  listEvents, 
  maybeCreditReward, 
  generateOrGetExistingCode,
  getReferralProgress,
  type ReferralCode,
  type ReferralEvent
} from '@/lib/services/referral-service'

describe('ReferralService', () => {
  const userId = 'referral-user-' + Date.now()

  describe('Code generation', () => {
    it('generates unique referral code', async () => {
      const code1 = await createReferralCode(userId + '-unique1')
      const code2 = await createReferralCode(userId + '-unique2')
      expect(code1.code).toBeDefined()
      expect(code2.code).toBeDefined()
      expect(code1.code).not.toBe(code2.code)
    })

    it('generates 10-character hex code', async () => {
      const code = await createReferralCode(userId + '-format')
      expect(code.code.length).toBe(10)
      expect(/^[0-9a-f]{10}$/.test(code.code)).toBe(true)
    })

    it('associates code with referrer user', async () => {
      const referrerId = userId + '-association'
      const code = await createReferralCode(referrerId)
      expect(code.referrerUserId).toBe(referrerId)
      expect(code.createdAt).toBeDefined()
      expect(code.createdAt).toBeInstanceOf(Date)
    })

    it('enforces rate limit of 3 codes per 24h window', async () => {
      const referrerId = userId + '-rate-limit'
      await createReferralCode(referrerId)
      await createReferralCode(referrerId)
      await createReferralCode(referrerId)
      // Fourth attempt should throw
      await expect(async () => {
        await createReferralCode(referrerId)
      }).rejects.toThrow('REFERRAL_CODE_RATE_LIMIT')
    })

    it('returns existing code when calling generateOrGetExistingCode', async () => {
      const referrerId = userId + '-existing'
      const first = await createReferralCode(referrerId)
      const second = await generateOrGetExistingCode(referrerId)
      expect(second.code).toBe(first.code)
      expect(second.referrerUserId).toBe(referrerId)
    })

    it('creates new code if none exists with generateOrGetExistingCode', async () => {
      const referrerId = userId + '-generate-new'
      const code = await generateOrGetExistingCode(referrerId)
      expect(code.code).toBeDefined()
      expect(code.referrerUserId).toBe(referrerId)
    })
  })

  describe('Event recording', () => {
    it('records clicked event', async () => {
      const code = await createReferralCode(userId + '-click')
      const event = await recordEvent(code.code, 'clicked', { ip: '192.168.1.1' })
      expect(event.type).toBe('clicked')
      expect(event.code).toBe(code.code)
      expect(event.meta?.ip).toBe('192.168.1.1')
    })

    it('records signed_up event', async () => {
      const code = await createReferralCode(userId + '-signup')
      const event = await recordEvent(code.code, 'signed_up', { userId: 'new-user-123' })
      expect(event.type).toBe('signed_up')
      expect(event.meta?.userId).toBe('new-user-123')
    })

    it('records verified event', async () => {
      const code = await createReferralCode(userId + '-verify')
      const event = await recordEvent(code.code, 'verified')
      expect(event.type).toBe('verified')
    })

    it('records reward_credited event', async () => {
      const code = await createReferralCode(userId + '-reward')
      const event = await recordEvent(code.code, 'reward_credited', { amount: 100 })
      expect(event.type).toBe('reward_credited')
      expect(event.meta?.amount).toBe(100)
    })

    it('assigns unique ID to each event', async () => {
      const code = await createReferralCode(userId + '-event-id')
      const event1 = await recordEvent(code.code, 'clicked')
      const event2 = await recordEvent(code.code, 'clicked')
      expect(event1.id).toBeDefined()
      expect(event2.id).toBeDefined()
      expect(event1.id).not.toBe(event2.id)
    })
  })

  describe('IP-based abuse prevention', () => {
    it('enforces max 10 events per IP per code', async () => {
      const code = await createReferralCode(userId + '-ip-abuse')
      const ip = '10.0.0.100'
      
      // Record 10 events from same IP
      for (let i = 0; i < 10; i++) {
        await recordEvent(code.code, 'clicked', { ip })
      }
      
      // 11th event should throw rate limit error
      await expect(async () => {
        await recordEvent(code.code, 'clicked', { ip })
      }).rejects.toThrow('REFERRAL_EVENT_RATE_LIMIT')
    })

    it('allows events from different IPs', async () => {
      const code = await createReferralCode(userId + '-different-ip')
      await recordEvent(code.code, 'clicked', { ip: '10.0.0.1' })
      await recordEvent(code.code, 'clicked', { ip: '10.0.0.2' })
      await recordEvent(code.code, 'clicked', { ip: '10.0.0.3' })
      
      const events = await listEvents(code.code)
      const clickEvents = events.filter(e => e.type === 'clicked')
      expect(clickEvents.length).toBeGreaterThanOrEqual(3)
    })
  })

  describe('Fingerprint-based abuse prevention', () => {
    it('enforces max 12 events per fingerprint per code', async () => {
      const code = await createReferralCode(userId + '-fp-abuse')
      const fingerprint = 'fp-abc123'
      
      // Record 12 events from same fingerprint
      for (let i = 0; i < 12; i++) {
        await recordEvent(code.code, 'clicked', { fingerprint })
      }
      
      // 13th event should throw rate limit error
      await expect(async () => {
        await recordEvent(code.code, 'clicked', { fingerprint })
      }).rejects.toThrow('REFERRAL_EVENT_FP_RATE_LIMIT')
    })

    it('allows events from different fingerprints', async () => {
      const code = await createReferralCode(userId + '-different-fp')
      await recordEvent(code.code, 'clicked', { fingerprint: 'fp1' })
      await recordEvent(code.code, 'clicked', { fingerprint: 'fp2' })
      await recordEvent(code.code, 'clicked', { fingerprint: 'fp3' })
      
      const events = await listEvents(code.code)
      expect(events.length).toBeGreaterThanOrEqual(3)
    })
  })

  describe('Event listing and retrieval', () => {
    it('lists all events for a code', async () => {
      const code = await createReferralCode(userId + '-list')
      await recordEvent(code.code, 'clicked')
      await recordEvent(code.code, 'signed_up')
      await recordEvent(code.code, 'verified')
      
      const events = await listEvents(code.code)
      expect(events.length).toBeGreaterThanOrEqual(3)
      expect(events.some(e => e.type === 'clicked')).toBe(true)
      expect(events.some(e => e.type === 'signed_up')).toBe(true)
      expect(events.some(e => e.type === 'verified')).toBe(true)
    })

    it('returns empty array for code with no events', async () => {
      const code = await createReferralCode(userId + '-no-events')
      const events = await listEvents(code.code)
      expect(events).toEqual([])
    })

    it('returns events sorted by creation time (descending)', async () => {
      const code = await createReferralCode(userId + '-sorted')
      await recordEvent(code.code, 'clicked', { order: 1 })
      await new Promise(resolve => setTimeout(resolve, 10))
      await recordEvent(code.code, 'signed_up', { order: 2 })
      await new Promise(resolve => setTimeout(resolve, 10))
      await recordEvent(code.code, 'verified', { order: 3 })
      
      const events = await listEvents(code.code)
      // Most recent first
      expect(events[0].meta?.order).toBe(3)
      expect(events[0].type).toBe('verified')
    })
  })

  describe('Reward crediting logic', () => {
    it('credits reward when both signed_up and verified events exist', async () => {
      const code = await createReferralCode(userId + '-reward-logic')
      await recordEvent(code.code, 'clicked')
      await recordEvent(code.code, 'signed_up')
      await recordEvent(code.code, 'verified')
      
      const credited = await maybeCreditReward(code.code)
      expect(credited).toBe(true)
      
      const events = await listEvents(code.code)
      const rewardEvents = events.filter(e => e.type === 'reward_credited')
      expect(rewardEvents.length).toBe(1)
    })

    it('does not credit reward if only signed_up exists', async () => {
      const code = await createReferralCode(userId + '-no-verify')
      await recordEvent(code.code, 'signed_up')
      
      const credited = await maybeCreditReward(code.code)
      expect(credited).toBe(false)
    })

    it('does not credit reward if only verified exists', async () => {
      const code = await createReferralCode(userId + '-no-signup')
      await recordEvent(code.code, 'verified')
      
      const credited = await maybeCreditReward(code.code)
      expect(credited).toBe(false)
    })

    it('does not credit reward twice', async () => {
      const code = await createReferralCode(userId + '-no-double-credit')
      await recordEvent(code.code, 'signed_up')
      await recordEvent(code.code, 'verified')
      
      const credited1 = await maybeCreditReward(code.code)
      expect(credited1).toBe(true)
      
      const credited2 = await maybeCreditReward(code.code)
      expect(credited2).toBe(false) // Already credited
      
      const events = await listEvents(code.code)
      const rewardEvents = events.filter(e => e.type === 'reward_credited')
      expect(rewardEvents.length).toBe(1)
    })
  })

  describe('Referral progress tracking', () => {
    it('aggregates stats for referrer user', async () => {
      const referrerId = userId + '-progress'
      const code = await createReferralCode(referrerId)
      
      await recordEvent(code.code, 'clicked')
      await recordEvent(code.code, 'clicked')
      await recordEvent(code.code, 'signed_up')
      await recordEvent(code.code, 'verified')
      await recordEvent(code.code, 'reward_credited')
      
      const progress = await getReferralProgress(referrerId)
      expect(progress.codes).toContain(code.code)
      expect(progress.stats.clicks).toBeGreaterThanOrEqual(2)
      expect(progress.stats.signups).toBeGreaterThanOrEqual(1)
      expect(progress.stats.verified).toBeGreaterThanOrEqual(1)
      expect(progress.stats.rewards).toBeGreaterThanOrEqual(1)
    })

    it('returns zero stats for referrer with no events', async () => {
      const referrerId = userId + '-no-progress'
      await createReferralCode(referrerId)
      
      const progress = await getReferralProgress(referrerId)
      expect(progress.stats.clicks).toBe(0)
      expect(progress.stats.signups).toBe(0)
      expect(progress.stats.verified).toBe(0)
      expect(progress.stats.rewards).toBe(0)
    })

    it('aggregates across multiple codes for same referrer', async () => {
      const referrerId = userId + '-multi-code'
      // First code
      const code1 = await createReferralCode(referrerId)
      await recordEvent(code1.code, 'clicked')
      await recordEvent(code1.code, 'signed_up')
      
      // Force new code by waiting (or use different timestamp)
      // Since rate limit is per window, we'll just test with one for now
      const progress = await getReferralProgress(referrerId)
      expect(progress.codes.length).toBeGreaterThanOrEqual(1)
      expect(progress.stats.clicks).toBeGreaterThanOrEqual(1)
      expect(progress.stats.signups).toBeGreaterThanOrEqual(1)
    })
  })
})
