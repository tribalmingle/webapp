import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'

import { POST as boostBidHandler } from '@/app/api/boosts/bid/route'
import { getCurrentUser } from '@/lib/auth'
import { submitBoostBid, BoostAuctionDisabledError } from '@/lib/boost/bid-service'
import { trackServerEvent } from '@/lib/analytics/segment'
import { InsufficientBoostCreditsError } from '@/lib/boost/credit-ledger-service'

vi.mock('@/lib/auth', () => ({
  getCurrentUser: vi.fn(),
}))

vi.mock('@/lib/boost/bid-service', () => {
  class BoostAuctionDisabledError extends Error {}
  class BoostBidConflictError extends Error {}
  class BoostBidTooLowError extends Error {}
  class BoostBidValidationError extends Error {}
  const submitBoostBid = vi.fn()
  const BOOST_AUCTION_LOCALES = ['africa_west', 'africa_east', 'diaspora_eu', 'diaspora_na'] as const
  const BOOST_AUCTION_PLACEMENTS = ['spotlight', 'travel', 'event'] as const

  return {
    submitBoostBid,
    BoostAuctionDisabledError,
    BoostBidConflictError,
    BoostBidTooLowError,
    BoostBidValidationError,
    BOOST_AUCTION_LOCALES,
    BOOST_AUCTION_PLACEMENTS,
  }
})

vi.mock('@/lib/analytics/segment', () => ({
  trackServerEvent: vi.fn(),
}))

vi.mock('@/lib/boost/credit-ledger-service', () => ({
  InsufficientBoostCreditsError: class extends Error {},
}))

describe('boost bid API', () => {
  beforeEach(() => {
    vi.mocked(getCurrentUser).mockReset()
    vi.mocked(submitBoostBid).mockReset()
    vi.mocked(trackServerEvent).mockReset()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('requires authentication', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null)

    const response = await boostBidHandler(new Request('http://localhost/api/boosts/bid', {
      method: 'POST',
      body: JSON.stringify({ placement: 'spotlight', locale: 'africa_west', bidAmountCredits: 10 }),
    }))

    expect(response.status).toBe(401)
  })

  it('returns validation errors for malformed payload', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ userId: 'user123', email: 'member@example.com' } as any)

    const response = await boostBidHandler(new Request('http://localhost/api/boosts/bid', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ placement: 'spotlight', locale: 'africa_west', bidAmountCredits: 0 }),
    }))

    expect(response.status).toBe(400)
    const payload = await response.json()
    expect(payload.success).toBe(false)
  })

  it('submits bids and returns serialized session metadata', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ userId: 'user123', email: 'member@example.com' } as any)
    vi.mocked(submitBoostBid).mockResolvedValue({
      sessionId: { toHexString: () => 'session1' } as any,
      status: 'pending',
      auctionWindowStart: new Date('2025-01-01T00:00:00Z'),
      boostStartsAt: new Date('2025-01-01T00:15:00Z'),
      boostEndsAt: new Date('2025-01-01T02:15:00Z'),
      bidAmountCredits: 20,
      availableCredits: 50,
    })

    const response = await boostBidHandler(new Request('http://localhost/api/boosts/bid', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ placement: 'spotlight', locale: 'africa_west', bidAmountCredits: 20, autoRollover: true }),
    }))

    expect(response.status).toBe(200)
    const payload = await response.json()
    expect(payload.success).toBe(true)
    expect(payload.bid.sessionId).toBe('session1')
    expect(trackServerEvent).toHaveBeenCalledWith(expect.objectContaining({
      event: 'boost.bid.submitted',
      properties: expect.objectContaining({ bidAmountCredits: 20, autoRollover: true }),
    }))
  })

  it('maps service errors to API responses', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ userId: 'user123', email: 'member@example.com' } as any)
    vi.mocked(submitBoostBid).mockRejectedValueOnce(new BoostAuctionDisabledError('disabled'))

    const disabledResponse = await boostBidHandler(new Request('http://localhost/api/boosts/bid', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ placement: 'spotlight', locale: 'africa_west', bidAmountCredits: 10 }),
    }))

    expect(disabledResponse.status).toBe(403)

    vi.mocked(submitBoostBid).mockRejectedValueOnce(new InsufficientBoostCreditsError())

    const insufficientResponse = await boostBidHandler(new Request('http://localhost/api/boosts/bid', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ placement: 'spotlight', locale: 'africa_west', bidAmountCredits: 10 }),
    }))

    expect(insufficientResponse.status).toBe(402)
  })
})
