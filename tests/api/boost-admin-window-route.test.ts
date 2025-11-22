import { ObjectId } from 'mongodb'
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'

import { GET as adminWindowHandler, POST as clearWindowHandler } from '@/app/api/boosts/admin/window/route'
import { getCurrentUser } from '@/lib/auth'
import { getMongoDb } from '@/lib/mongodb'
import { getAuctionSettings } from '@/lib/boost/bid-service'
import { clearAuctionWindow } from '@/lib/boost/auction-clearing-service'
import type { ClearAuctionWindowResult } from '@/lib/boost/auction-clearing-service'

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

vi.mock('@/lib/boost/auction-clearing-service', () => ({
  clearAuctionWindow: vi.fn(),
}))

describe('boost admin window API', () => {
  const windowStart = new Date('2025-01-01T00:00:00Z')
  const nextWindowStart = new Date('2025-01-01T00:15:00Z')
  let collection: any
  let db: any

  beforeEach(() => {
    collection = {
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
    vi.mocked(clearAuctionWindow).mockResolvedValue(makeClearResult())
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('requires authentication and admin role', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null)
    let response = await adminWindowHandler(new Request('http://localhost/api/boosts/admin/window'))
    expect(response.status).toBe(401)

    vi.mocked(getCurrentUser).mockResolvedValue({ userId: 'user', roles: ['member'] } as any)
    response = await adminWindowHandler(new Request('http://localhost/api/boosts/admin/window'))
    expect(response.status).toBe(403)
  })

  it('returns pending and active bids for the requested locale', async () => {
    const pendingBid = makeBid('01', windowStart, 'pending')
    const nextBid = makeBid('02', nextWindowStart, 'pending')
    const activeBid = makeBid('03', windowStart, 'active')

    collection.find.mockReturnValue(createCursor([]))
    collection.find
      .mockReturnValueOnce(createCursor([pendingBid]))
      .mockReturnValueOnce(createCursor([nextBid]))
      .mockReturnValueOnce(createCursor([activeBid]))

    vi.mocked(getCurrentUser).mockResolvedValue({ userId: 'admin', roles: ['admin'] } as any)

    const response = await adminWindowHandler(new Request('http://localhost/api/boosts/admin/window?locale=africa_west&placement=spotlight'))
    expect(response.status).toBe(200)

    const payload = await response.json()
    expect(payload.success).toBe(true)
    expect(payload.pendingBids[0].sessionId).toBe(pendingBid._id.toHexString())
    expect(payload.nextWindowBids).toHaveLength(1)
    expect(payload.activeSessions[0].status).toBe('active')
  })

  it('requires authentication and admin role for POST', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null)
    let response = await clearWindowHandler(
      new Request('http://localhost/api/boosts/admin/window', { method: 'POST', body: JSON.stringify({}) }),
    )
    expect(response.status).toBe(401)

    vi.mocked(getCurrentUser).mockResolvedValue({ userId: 'user', roles: ['member'] } as any)
    response = await clearWindowHandler(
      new Request('http://localhost/api/boosts/admin/window', {
        method: 'POST',
        body: JSON.stringify({ locale: 'africa_west', placement: 'spotlight' }),
        headers: { 'content-type': 'application/json' },
      }),
    )
    expect(response.status).toBe(403)
  })

  it('clears the requested auction window when authorized', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ userId: 'admin', roles: ['admin'] } as any)
    const mockResult = makeClearResult({ activatedSessionIds: ['abc123'] })
    vi.mocked(clearAuctionWindow).mockResolvedValue(mockResult)

    const response = await clearWindowHandler(
      new Request('http://localhost/api/boosts/admin/window', {
        method: 'POST',
        body: JSON.stringify({ locale: 'africa_west', placement: 'spotlight' }),
        headers: { 'content-type': 'application/json' },
      }),
    )

    expect(response.status).toBe(200)
    const payload = await response.json()
    expect(payload.success).toBe(true)
    expect(payload.result.activatedSessionIds).toEqual(['abc123'])
    expect(clearAuctionWindow).toHaveBeenCalledWith(expect.objectContaining({ locale: 'africa_west', placement: 'spotlight' }))
  })

  it('passes through referenceTime overrides for manual clears', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ userId: 'ops', roles: ['ops'] } as any)
    const referenceTime = '2025-01-01T00:05:00.000Z'

    await clearWindowHandler(
      new Request('http://localhost/api/boosts/admin/window', {
        method: 'POST',
        body: JSON.stringify({ locale: 'africa_west', placement: 'spotlight', referenceTime }),
        headers: { 'content-type': 'application/json' },
      }),
    )

    const args = vi.mocked(clearAuctionWindow).mock.calls.at(-1)?.[0]
    expect(args?.referenceTime?.toISOString()).toBe(referenceTime)
  })

  it('returns 409 when auction is disabled for locale', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ userId: 'ops', roles: ['ops'] } as any)
    vi.mocked(clearAuctionWindow).mockResolvedValue(makeClearResult({ settingsDisabled: true }))

    const response = await clearWindowHandler(
      new Request('http://localhost/api/boosts/admin/window', {
        method: 'POST',
        body: JSON.stringify({ locale: 'africa_west', placement: 'spotlight' }),
        headers: { 'content-type': 'application/json' },
      }),
    )

    expect(response.status).toBe(409)
    const payload = await response.json()
    expect(payload.success).toBe(false)
    expect(payload.error).toContain('disabled')
  })
})

function makeBid(id: string, windowStart: Date, status: 'pending' | 'active') {
  return {
    _id: new ObjectId(`507f1f77bcf86cd7994390${id}`),
    userId: new ObjectId(`507f1f77bcf86cd7994399${id}`),
    placement: 'spotlight',
    locale: 'africa_west',
    bidAmountCredits: 10,
    budgetCredits: 10,
    auctionWindowStart: windowStart,
    status,
    metadata: { autoRollover: false },
    createdAt: windowStart,
    startedAt: new Date(windowStart.getTime() + 15 * 60 * 1000),
    endsAt: new Date(windowStart.getTime() + 135 * 60 * 1000),
  }
}

function createCursor<T>(docs: T[]) {
  return {
    sort: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    toArray: vi.fn().mockResolvedValue(docs),
  }
}

function makeClearResult(overrides: Partial<ClearAuctionWindowResult> = {}): ClearAuctionWindowResult {
  return {
    locale: 'africa_west',
    placement: 'spotlight',
    windowStart: new Date('2025-01-01T00:00:00Z'),
    boostStartsAt: new Date('2025-01-01T00:15:00Z'),
    boostEndsAt: new Date('2025-01-01T02:15:00Z'),
    nextWindowStart: new Date('2025-01-01T00:15:00Z'),
    activatedSessionIds: [],
    refundedSessionIds: [],
    rolledOverSessionIds: [],
    settingsDisabled: false,
    ...overrides,
  }
}
