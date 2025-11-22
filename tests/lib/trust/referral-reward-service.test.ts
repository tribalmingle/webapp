import { ObjectId } from 'mongodb'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { issueReferralTierReward } from '@/lib/trust/referral-reward-service'
import { grantReferralBoostCredits } from '@/lib/boost/credit-ledger-service'
import { ensureReferralDocument, getReferralProgress } from '@/lib/trust/referral-progress-service'
import { trackServerEvent } from '@/lib/analytics/segment'

vi.mock('@/lib/analytics/segment', () => ({
  trackServerEvent: vi.fn(),
}))

vi.mock('@/lib/boost/credit-ledger-service', () => ({
  grantReferralBoostCredits: vi.fn(),
}))

vi.mock('@/lib/trust/referral-progress-service', () => ({
  ensureReferralDocument: vi.fn(),
  getReferralProgress: vi.fn(),
}))

describe('issueReferralTierReward', () => {
  const referrerId = new ObjectId('507f1f77bcf86cd799439055')
  const referralDoc = {
    _id: new ObjectId('507f1f77bcf86cd799439066'),
    referrerUserId: referrerId,
    metadata: { lastRewardedTier: 'bronze' },
  }
  const collection = {
    updateOne: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(ensureReferralDocument).mockResolvedValue({ document: referralDoc as any, collection } as any)
    vi.mocked(getReferralProgress).mockResolvedValue({
      referralCode: 'ref123',
      tier: { key: 'silver', label: 'Silver', minSuccessful: 2, memberReward: '', guardianReward: '' },
      counts: { totalInvitees: 0, pending: 0, successful: 0, rewarded: 0, rolling90dCount: 2 },
      tiers: [],
      nextTier: null,
      shareUrl: null,
      rollingWindowStart: new Date(),
      rollingWindowDays: 90,
      payoutsIssued: 0,
    } as any)
  })

  it('grants boost credits when user attains a higher tier', async () => {
    const result = await issueReferralTierReward(referrerId)

    expect(result).toEqual({ rewarded: true, tier: 'silver', credits: 5 })
    expect(grantReferralBoostCredits).toHaveBeenCalledWith(
      expect.objectContaining({ userId: referrerId, amount: 5, reason: 'referral_silver_reward' }),
    )
    expect(collection.updateOne).toHaveBeenCalled()
    expect(trackServerEvent).toHaveBeenCalledWith(
      expect.objectContaining({ event: 'referral.reward.issued', properties: expect.objectContaining({ tier: 'silver', credits: 5 }) }),
    )
  })

  it('skips when tier already rewarded', async () => {
    vi.mocked(ensureReferralDocument).mockResolvedValue({
      document: { ...referralDoc, metadata: { lastRewardedTier: 'silver' } } as any,
      collection,
    } as any)

    const result = await issueReferralTierReward(referrerId)

    expect(result.rewarded).toBe(false)
    expect(grantReferralBoostCredits).not.toHaveBeenCalled()
    expect(collection.updateOne).not.toHaveBeenCalled()
  })
})
