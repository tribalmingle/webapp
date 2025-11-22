import { ObjectId } from 'mongodb'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { clearAuctionWindow } from '@/lib/boost/auction-clearing-service'
import { getMongoDb } from '@/lib/mongodb'
import { getAuctionSettings } from '@/lib/boost/bid-service'
import { debitBoostCredits, InsufficientBoostCreditsError } from '@/lib/boost/credit-ledger-service'
import { trackServerEvent } from '@/lib/analytics/segment'

vi.mock('@/lib/mongodb', () => ({
  getMongoDb: vi.fn(),
}))

vi.mock('@/lib/boost/bid-service', async () => {
  const actual = await vi.importActual<typeof import('@/lib/boost/bid-service')>('@/lib/boost/bid-service')
  return {
    ...actual,
    getAuctionSettings: vi.fn(),
  }
})

vi.mock('@/lib/boost/credit-ledger-service', async () => {
  const actual = await vi.importActual<typeof import('@/lib/boost/credit-ledger-service')>('@/lib/boost/credit-ledger-service')
  return {
    ...actual,
    debitBoostCredits: vi.fn(),
  }
})

vi.mock('@/lib/analytics/segment', () => ({
  trackServerEvent: vi.fn(),
}))

describe('clearAuctionWindow', () => {
  const windowStart = new Date('2025-01-01T00:00:00Z')
  let collection: any
  let db: any

  beforeEach(() => {
    collection = {
      find: vi.fn(),
      bulkWrite: vi.fn().mockResolvedValue({ acknowledged: true }),
    }
    db = { collection: vi.fn().mockReturnValue(collection) }
    vi.mocked(getMongoDb).mockResolvedValue(db)
    vi.mocked(getAuctionSettings).mockResolvedValue({
      enabled: true,
      minBidCredits: 5,
      windowMinutes: 15,
      durationMinutes: 120,
      maxWinners: 1,
    })
    vi.mocked(debitBoostCredits).mockResolvedValue({ remaining: 10, debited: 5 } as any)
    vi.mocked(trackServerEvent).mockReset()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('activates top bids and refunds the rest', async () => {
    const winner = buildBid('01', windowStart, { bidAmountCredits: 10 })
    const loser = buildBid('02', windowStart, { bidAmountCredits: 8 })

    collection.find.mockReturnValue(createCursor([winner, loser]))

    const result = await clearAuctionWindow({ locale: 'africa_west', placement: 'spotlight', windowStart })

    expect(result.activatedSessionIds).toEqual([winner._id.toHexString()])
    expect(result.refundedSessionIds).toContain(loser._id.toHexString())
    expect(collection.bulkWrite).toHaveBeenCalled()
    expect(trackServerEvent).toHaveBeenCalledWith(expect.objectContaining({ event: 'boost.auction.cleared' }))
    expect(trackServerEvent).toHaveBeenCalledWith(expect.objectContaining({
      event: 'boost.auction.refunded',
      properties: expect.objectContaining({ refundCount: 1, lostAuction: 1, insufficientCredits: 0 }),
    }))
  })

  it('rolls over bids marked for auto rollover', async () => {
    const winner = buildBid('01', windowStart, { bidAmountCredits: 12 })
    const rolloverBid = buildBid('02', windowStart, { bidAmountCredits: 11, metadata: { autoRollover: true, rolloverCount: 1 } })

    collection.find.mockReturnValue(createCursor([winner, rolloverBid]))

    const result = await clearAuctionWindow({ locale: 'africa_west', placement: 'spotlight', windowStart })

    expect(result.rolledOverSessionIds).toEqual([rolloverBid._id.toHexString()])
    const bulkOps = collection.bulkWrite.mock.calls[0][0]
    const rolloverUpdate = bulkOps.find((op: any) => op.updateOne.filter._id.equals(rolloverBid._id))
    expect(rolloverUpdate.updateOne.update.$set.metadata.rolloverCount).toBe(2)
    expect(trackServerEvent).toHaveBeenCalledWith(expect.objectContaining({
      event: 'boost.auction.cleared',
      properties: expect.objectContaining({ rollovers: 1, refunds: 0 }),
    }))
    expect(trackServerEvent).not.toHaveBeenCalledWith(expect.objectContaining({ event: 'boost.auction.refunded' }))
  })

  it('refunds winners who lack credits instead of throwing', async () => {
    const winner = buildBid('01', windowStart, { bidAmountCredits: 15 })
    vi.mocked(debitBoostCredits).mockRejectedValueOnce(new InsufficientBoostCreditsError())
    collection.find.mockReturnValue(createCursor([winner]))

    const result = await clearAuctionWindow({ locale: 'africa_west', placement: 'spotlight', windowStart })

    expect(result.activatedSessionIds).toHaveLength(0)
    expect(result.refundedSessionIds).toEqual([winner._id.toHexString()])
    expect(trackServerEvent).toHaveBeenCalledWith(expect.objectContaining({
      event: 'boost.auction.refunded',
      properties: expect.objectContaining({ insufficientCredits: 1, lostAuction: 0 }),
    }))
  })
})

function buildBid(id: string, windowStart: Date, overrides: Partial<ReturnType<typeof baseBid>> = {}) {
  return {
    ...baseBid(id, windowStart),
    ...overrides,
    metadata: { ...(baseBid(id, windowStart).metadata ?? {}), ...(overrides.metadata ?? {}) },
  }
}

function baseBid(id: string, windowStart: Date) {
  return {
    _id: new ObjectId(`507f1f77bcf86cd7994390${id}`),
    userId: new ObjectId(`507f1f77bcf86cd7994399${id}`),
    placement: 'spotlight' as const,
    locale: 'africa_west' as const,
    bidAmountCredits: 10,
    budgetCredits: 10,
    auctionWindowStart: windowStart,
    status: 'pending' as const,
    metadata: { autoRollover: false, rolloverCount: 0 },
    createdAt: windowStart,
  }
}

function createCursor<T>(docs: T[]) {
  return {
    sort: vi.fn().mockReturnValue({
      toArray: vi.fn().mockResolvedValue(docs),
    }),
    toArray: vi.fn().mockResolvedValue(docs),
  }
}
