import { ObjectId } from 'mongodb'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { getReferralProgress } from '@/lib/trust/referral-progress-service'
import { getMongoDb } from '@/lib/mongodb'

vi.mock('@/lib/mongodb', () => ({
  getMongoDb: vi.fn(),
}))

type MockCollection = {
  findOne: ReturnType<typeof vi.fn>
  insertOne: ReturnType<typeof vi.fn>
  updateOne: ReturnType<typeof vi.fn>
}

describe('referral progress service', () => {
  let collection: MockCollection
  let db: { collection: ReturnType<typeof vi.fn> }

  beforeEach(() => {
    collection = {
      findOne: vi.fn(),
      insertOne: vi.fn().mockResolvedValue({ acknowledged: true }),
      updateOne: vi.fn().mockResolvedValue({ acknowledged: true }),
    }

    db = {
      collection: vi.fn().mockReturnValue(collection),
    }

    vi.mocked(getMongoDb).mockResolvedValue(db as any)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('creates a referral document when none exists and returns defaults', async () => {
    collection.findOne.mockResolvedValue(null)

    vi.useFakeTimers()
    vi.setSystemTime(new Date('2025-01-01T00:00:00Z'))

    try {
      const result = await getReferralProgress('507f1f77bcf86cd799439011')

      expect(collection.insertOne).toHaveBeenCalled()
      expect(result.referralCode).toBeTruthy()
      expect(result.shareUrl).toContain(result.referralCode as string)
      expect(result.tier.key).toBe('bronze')
      expect(result.counts.totalInvitees).toBe(0)
      expect(result.counts.rolling90dCount).toBe(0)
      expect(result.tiers[0].attained).toBe(true)
    } finally {
      vi.useRealTimers()
    }
  })

  it('computes tier progress and persists updated counters', async () => {
    const referrerUserId = new ObjectId('507f1f77bcf86cd799439011')
    const referralDoc = {
      _id: new ObjectId('507f1f77bcf86cd799439012'),
      referrerUserId,
      referralCode: 'shareme',
      sourceCampaign: undefined,
      bonusStatus: 'pending',
      tier: 'bronze',
      rolling90dCount: 0,
      invitees: [
        {
          userId: new ObjectId(),
          invitedAt: new Date('2024-11-15T00:00:00Z'),
          joinedAt: new Date('2024-12-01T00:00:00Z'),
          status: 'joined',
        },
        {
          email: 'friend@example.com',
          invitedAt: new Date('2024-11-10T00:00:00Z'),
          joinedAt: new Date('2024-11-12T00:00:00Z'),
          status: 'rewarded',
        },
        {
          email: 'old@example.com',
          invitedAt: new Date('2024-05-01T00:00:00Z'),
          joinedAt: new Date('2024-05-15T00:00:00Z'),
          status: 'joined',
        },
      ],
      payouts: [
        {
          amount: { currency: 'USD', amountCents: 500 },
          issuedAt: new Date('2024-12-20T00:00:00Z'),
        },
      ],
      metadata: undefined,
      lastRewardIssuedAt: undefined,
      createdAt: new Date('2024-01-01T00:00:00Z'),
      updatedAt: new Date('2024-01-01T00:00:00Z'),
    }

    collection.findOne.mockResolvedValue(referralDoc)

    vi.useFakeTimers()
    vi.setSystemTime(new Date('2025-01-01T00:00:00Z'))

    try {
      const result = await getReferralProgress(referrerUserId)

      expect(result.tier.key).toBe('silver')
      expect(result.counts.successful).toBe(3)
      expect(result.counts.rewarded).toBe(1)
      expect(result.counts.rolling90dCount).toBe(2)
      expect(result.nextTier?.remaining).toBe(3)
      expect(result.lastRewardIssuedAt?.toISOString()).toBe('2024-12-20T00:00:00.000Z')
      expect(collection.updateOne).toHaveBeenCalledWith(
        { _id: referralDoc._id },
        expect.objectContaining({
          $set: expect.objectContaining({ tier: 'silver', rolling90dCount: 2 }),
        }),
      )
    } finally {
      vi.useRealTimers()
    }
  })
})
