import { ObjectId } from 'mongodb'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { GET as memberWindowHandler } from '@/app/api/boosts/window/route'
import { getCurrentUser } from '@/lib/auth'
import { getMongoDb } from '@/lib/mongodb'
import { getAuctionSettings } from '@/lib/boost/bid-service'
import { getBoostCreditBalance } from '@/lib/boost/credit-ledger-service'

vi.mock('@/lib/auth', () => ({
  getCurrentUser: vi.fn(),
}))

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

vi.mock('@/lib/boost/credit-ledger-service', () => ({
  getBoostCreditBalance: vi.fn(),
}))

describe('boost member window API', () => {
  const userId = new ObjectId('507f1f77bcf86cd799439011')
  const windowStart = new Date('2025-01-01T00:00:00Z')
  const now = new Date('2025-01-01T00:05:00Z')
  let collection: any
  let db: any

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(now)

    collection = {
      findOne: vi.fn(),
      find: vi.fn(),
    }
    db = { collection: vi.fn().mockReturnValue(collection) }
    vi.mocked(getMongoDb).mockResolvedValue(db)
    vi.mocked(getAuctionSettings).mockResolvedValue({
      enabled: true,
      minBidCredits: 5,
      windowMinutes: 15,
      durationMinutes: 120,
      maxWinners: 5,
    })
    vi.mocked(getBoostCreditBalance).mockResolvedValue(25)
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  it('requires authentication', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null)

    const response = await memberWindowHandler(new Request('http://localhost/api/boosts/window'))
    expect(response.status).toBe(401)
  })

  it('returns 409 when auctions are disabled for locale', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ userId: userId.toHexString() } as any)
    vi.mocked(getAuctionSettings).mockResolvedValue({
      enabled: false,
      minBidCredits: 5,
      windowMinutes: 15,
      durationMinutes: 120,
      maxWinners: 5,
    })

    const response = await memberWindowHandler(
      new Request('http://localhost/api/boosts/window?locale=africa_west&placement=spotlight'),
    )

    expect(response.status).toBe(409)
    const payload = await response.json()
    expect(payload.success).toBe(false)
  })

  it('returns member specific bid summaries', async () => {
    const pendingBid = makeBid('01', 'pending', windowStart)
    const activeBid = makeBid('02', 'active', windowStart)
    const historyBid = makeBid('03', 'cleared', windowStart)

    collection.findOne.mockResolvedValueOnce(pendingBid).mockResolvedValueOnce(null)
    collection.find
      .mockReturnValueOnce(createCursor([activeBid]))
      .mockReturnValueOnce(createCursor([historyBid]))

    vi.mocked(getCurrentUser).mockResolvedValue({ userId: userId.toHexString() } as any)

    const response = await memberWindowHandler(
      new Request('http://localhost/api/boosts/window?locale=africa_west&placement=spotlight'),
    )

    expect(response.status).toBe(200)
    const payload = await response.json()

    expect(payload.success).toBe(true)
    expect(payload.window.locale).toBe('africa_west')
    expect(payload.bids.pending.sessionId).toBe(pendingBid._id.toHexString())
    expect(payload.bids.active).toHaveLength(1)
    expect(payload.bids.history).toHaveLength(1)
    expect(payload.credits.available).toBe(25)
  })
})

function makeBid(id: string, status: 'pending' | 'active' | 'cleared', auctionWindowStart: Date) {
  return {
    _id: new ObjectId(`507f1f77bcf86cd7994390${id}`),
    userId: new ObjectId('507f1f77bcf86cd799439011'),
    placement: 'spotlight',
    locale: 'africa_west',
    bidAmountCredits: 10,
    budgetCredits: 10,
    auctionWindowStart,
    status,
    metadata: { autoRollover: false },
    createdAt: auctionWindowStart,
    updatedAt: auctionWindowStart,
    startedAt: new Date(auctionWindowStart.getTime() + 15 * 60 * 1000),
    endsAt: new Date(auctionWindowStart.getTime() + 135 * 60 * 1000),
  }
}

function createCursor<T>(docs: T[]) {
  return {
    sort: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    toArray: vi.fn().mockResolvedValue(docs),
  }
}
