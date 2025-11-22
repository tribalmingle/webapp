import { ObjectId } from 'mongodb'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  submitBoostBid,
  BoostAuctionDisabledError,
  BoostBidConflictError,
  BoostBidTooLowError,
} from '@/lib/boost/bid-service'
import { getMongoDb } from '@/lib/mongodb'
import { getBoostCreditBalance } from '@/lib/boost/credit-ledger-service'
import { getLaunchDarklyClient } from '@/lib/launchdarkly/server'

vi.mock('@/lib/mongodb', () => ({
  getMongoDb: vi.fn(),
}))

vi.mock('@/lib/boost/credit-ledger-service', async () => {
  const actual = await vi.importActual<typeof import('@/lib/boost/credit-ledger-service')>('@/lib/boost/credit-ledger-service')
  return {
    ...actual,
    getBoostCreditBalance: vi.fn(),
  }
})

vi.mock('@/lib/launchdarkly/server', () => ({
  getLaunchDarklyClient: vi.fn(),
}))

type MockCollection = {
  findOne: ReturnType<typeof vi.fn>
  insertOne: ReturnType<typeof vi.fn>
}

describe('submitBoostBid', () => {
  let collection: MockCollection
  let db: { collection: ReturnType<typeof vi.fn> }
  const mockLdClient = { variation: vi.fn() }

  beforeEach(() => {
    collection = {
      findOne: vi.fn().mockResolvedValue(null),
      insertOne: vi.fn().mockResolvedValue({ acknowledged: true }),
    }
    db = { collection: vi.fn().mockReturnValue(collection) }
    vi.mocked(getMongoDb).mockResolvedValue(db as any)
    vi.mocked(getBoostCreditBalance).mockResolvedValue(25)
    vi.mocked(getLaunchDarklyClient).mockResolvedValue(mockLdClient as any)
    mockLdClient.variation.mockResolvedValue(true)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('stores a pending bid aligned to the current auction window', async () => {
    const now = new Date('2025-01-01T00:07:00Z')

    const result = await submitBoostBid({
      userId: new ObjectId('507f1f77bcf86cd799439011'),
      placement: 'spotlight',
      locale: 'africa_west',
      bidAmountCredits: 10,
      autoRollover: true,
    }, { now })

    expect(collection.insertOne).toHaveBeenCalledWith(expect.objectContaining({
      placement: 'spotlight',
      locale: 'africa_west',
      bidAmountCredits: 10,
      status: 'pending',
      auctionWindowStart: new Date('2025-01-01T00:00:00.000Z'),
      metadata: expect.objectContaining({ autoRollover: true }),
    }))

    expect(result.bidAmountCredits).toBe(10)
    expect(result.auctionWindowStart.toISOString()).toBe('2025-01-01T00:00:00.000Z')
    expect(result.boostStartsAt.toISOString()).toBe('2025-01-01T00:15:00.000Z')
    expect(result.availableCredits).toBe(25)
  })

  it('throws when auctions are disabled for the locale', async () => {
    mockLdClient.variation.mockResolvedValue(false)

    await expect(submitBoostBid({
      userId: '507f1f77bcf86cd799439011',
      placement: 'spotlight',
      locale: 'africa_west',
      bidAmountCredits: 10,
    })).rejects.toBeInstanceOf(BoostAuctionDisabledError)
  })

  it('validates against locale-specific minimum bid', async () => {
    mockLdClient.variation.mockResolvedValue({
      enabled: true,
      locales: {
        africa_west: { minBidCredits: 15 },
      },
    })

    await expect(submitBoostBid({
      userId: '507f1f77bcf86cd799439011',
      placement: 'spotlight',
      locale: 'africa_west',
      bidAmountCredits: 10,
    })).rejects.toBeInstanceOf(BoostBidTooLowError)
  })

  it('prevents duplicate bids within the same window', async () => {
    collection.findOne.mockResolvedValueOnce({ _id: new ObjectId() })

    await expect(submitBoostBid({
      userId: '507f1f77bcf86cd799439011',
      placement: 'spotlight',
      locale: 'africa_west',
      bidAmountCredits: 12,
    })).rejects.toBeInstanceOf(BoostBidConflictError)
  })
})
