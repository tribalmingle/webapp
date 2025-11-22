import { describe, expect, it, vi } from 'vitest'

import { GET as referralProgressHandler } from '@/app/api/referrals/progress/route'
import { getCurrentUser } from '@/lib/auth'
import { getReferralProgress } from '@/lib/trust/referral-progress-service'
import { issueReferralTierReward } from '@/lib/trust/referral-reward-service'

vi.mock('@/lib/auth', () => ({
  getCurrentUser: vi.fn(),
}))

vi.mock('@/lib/trust/referral-progress-service', () => ({
  getReferralProgress: vi.fn(),
}))

vi.mock('@/lib/trust/referral-reward-service', () => ({
  issueReferralTierReward: vi.fn(),
}))

describe('referral progress API', () => {
  it('requires authentication', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null)

    const response = await referralProgressHandler()
    expect(response.status).toBe(401)
  })

  it('returns referral progress for authenticated users', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ userId: '507f1f77bcf86cd799439011', email: 'member@example.com' } as any)
    vi.mocked(getReferralProgress).mockResolvedValue({
      referralCode: 'shareme',
      shareUrl: 'https://tribalmingle.test/r/shareme',
      tier: { key: 'silver', label: 'Silver', minSuccessful: 2, memberReward: 'credits', guardianReward: 'concierge' },
      tiers: [
        { key: 'bronze', label: 'Bronze', minSuccessful: 0, memberReward: 'credit', guardianReward: 'priority review', attained: true },
        { key: 'silver', label: 'Silver', minSuccessful: 2, memberReward: 'credits', guardianReward: 'concierge', attained: true },
      ],
      nextTier: { key: 'gold', label: 'Gold', minSuccessful: 5, memberReward: 'cash', guardianReward: 'stipend', remaining: 3 },
      counts: { totalInvitees: 3, pending: 1, successful: 2, rewarded: 1, rolling90dCount: 2 },
      rollingWindowStart: new Date('2024-10-01T00:00:00Z'),
      rollingWindowDays: 90,
      payoutsIssued: 1,
      lastRewardIssuedAt: new Date('2024-12-01T00:00:00Z'),
    })

    const response = await referralProgressHandler()
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.success).toBe(true)
    expect(payload.tier.key).toBe('silver')
    expect(payload.nextTier.remaining).toBe(3)
    expect(vi.mocked(getReferralProgress)).toHaveBeenCalledWith('507f1f77bcf86cd799439011')
    expect(issueReferralTierReward).toHaveBeenCalledWith('507f1f77bcf86cd799439011')
  })
})
