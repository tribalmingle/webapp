import { ObjectId } from 'mongodb'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { debitBoostCredits, grantReferralBoostCredits, InsufficientBoostCreditsError } from '@/lib/boost/credit-ledger-service'
import { getMongoDb } from '@/lib/mongodb'

vi.mock('@/lib/mongodb', () => ({
  getMongoDb: vi.fn(),
}))

type MockCollection = {
  updateOne: ReturnType<typeof vi.fn>
  bulkWrite: ReturnType<typeof vi.fn>
  find: ReturnType<typeof vi.fn>
}

describe('boost credit ledger service', () => {
  let collection: MockCollection
  let db: { collection: ReturnType<typeof vi.fn> }

  beforeEach(() => {
    collection = {
      updateOne: vi.fn().mockResolvedValue({ acknowledged: true }),
      bulkWrite: vi.fn().mockResolvedValue({ acknowledged: true }),
      find: vi.fn(),
    }

    db = {
      collection: vi.fn().mockReturnValue(collection),
    }

    vi.mocked(getMongoDb).mockResolvedValue(db as any)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('grants referral credits and returns updated balance', async () => {
    const userId = new ObjectId('507f1f77bcf86cd799439011')

    collection.find.mockImplementation((_query, options) => {
      if (options?.projection) {
        return { toArray: vi.fn().mockResolvedValue([{ remaining: 5 }]) } as any
      }

      return { toArray: vi.fn().mockResolvedValue([]) } as any
    })

    const balance = await grantReferralBoostCredits({ userId, amount: 5, reason: 'tier_bonus' })

    expect(collection.updateOne).toHaveBeenCalledWith(
      { userId, featureKey: 'boost_credits', source: 'referral' },
      expect.objectContaining({
        $inc: { quantity: 5, remaining: 5 },
        $push: { audit: expect.objectContaining({ delta: 5, reason: 'tier_bonus' }) },
        $setOnInsert: expect.objectContaining({ source: 'referral', renewalSchedule: 'one_time' }),
      }),
      { upsert: true },
    )
    expect(balance).toBe(5)
  })

  it('debits boost credits in priority order across buckets', async () => {
    const userId = new ObjectId('507f1f77bcf86cd799439099')
    const referralBucket = {
      _id: new ObjectId('507f1f77bcf86cd799439021'),
      userId,
      featureKey: 'boost_credits',
      source: 'referral' as const,
      remaining: 3,
      createdAt: new Date('2024-01-01T00:00:00Z'),
    }
    const subscriptionBucket = {
      _id: new ObjectId('507f1f77bcf86cd799439022'),
      userId,
      featureKey: 'boost_credits',
      source: 'subscription' as const,
      remaining: 5,
      createdAt: new Date('2024-02-01T00:00:00Z'),
    }

    collection.find.mockImplementation((_query, options) => {
      if (options?.projection) {
        return { toArray: vi.fn().mockResolvedValue([{ remaining: 4 }]) } as any
      }

      return { toArray: vi.fn().mockResolvedValue([subscriptionBucket, referralBucket]) } as any
    })

    const result = await debitBoostCredits({ userId, amount: 4 })

    expect(collection.bulkWrite).toHaveBeenCalledTimes(1)
    const operations = collection.bulkWrite.mock.calls[0][0]
    expect(operations).toHaveLength(2)
    expect(operations[0]).toMatchObject({ updateOne: { filter: { _id: referralBucket._id }, update: { $inc: { remaining: -3 } } } })
    expect(operations[1]).toMatchObject({ updateOne: { filter: { _id: subscriptionBucket._id }, update: { $inc: { remaining: -1 } } } })
    expect(result).toEqual({ debited: 4, remaining: 4 })
  })

  it('throws when debit exceeds available credits', async () => {
    const userId = new ObjectId('507f1f77bcf86cd799439033')
    collection.find.mockImplementation((_query, options) => {
      if (options?.projection) {
        throw new Error('should not compute balance on failure')
      }
      return {
        toArray: vi.fn().mockResolvedValue([
          {
            _id: new ObjectId('507f1f77bcf86cd799439034'),
            userId,
            featureKey: 'boost_credits',
            source: 'referral',
            remaining: 1,
          },
        ]),
      } as any
    })

    await expect(debitBoostCredits({ userId, amount: 5 })).rejects.toBeInstanceOf(InsufficientBoostCreditsError)
    expect(collection.bulkWrite).not.toHaveBeenCalled()
  })
})
