import { describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/boost/bid-service', () => ({
  BOOST_AUCTION_LOCALES: ['africa_west'] as const,
  BOOST_AUCTION_PLACEMENTS: ['spotlight'] as const,
}))

vi.mock('@/lib/boost/auction-clearing-service', () => ({
  clearAuctionWindow: vi.fn(),
}))

import { clearAuctionWindow } from '@/lib/boost/auction-worker'
import { clearAuctionWindow as clearAuctionWindowService } from '@/lib/boost/auction-clearing-service'
import type { ClearAuctionWindowResult as ServiceClearResult } from '@/lib/boost/auction-clearing-service'

describe('clearAuctionWindow worker wrapper', () => {
  const now = new Date('2025-01-01T00:00:00Z')

  it('summarizes the clearing service result', async () => {
    vi.mocked(clearAuctionWindowService).mockResolvedValue(
      makeServiceResult({
        activatedSessionIds: ['a', 'b'],
        rolledOverSessionIds: ['c'],
        refundedSessionIds: ['d'],
      }),
    )

    const result = await clearAuctionWindow({ locale: 'africa_west', placement: 'spotlight', now })

    expect(result).toMatchObject({
      winnersCleared: 2,
      rollovers: 1,
      refunded: 1,
      totalBids: 4,
    })
    expect(clearAuctionWindowService).toHaveBeenCalledWith(
      expect.objectContaining({ locale: 'africa_west', placement: 'spotlight', referenceTime: now }),
    )
  })

  it('passes through explicit window start overrides', async () => {
    const windowStart = new Date('2025-01-01T00:15:00Z')
    vi.mocked(clearAuctionWindowService).mockResolvedValue(makeServiceResult({ windowStart }))

    await clearAuctionWindow({ locale: 'africa_west', placement: 'spotlight', windowStart })

    expect(clearAuctionWindowService).toHaveBeenCalledWith(
      expect.objectContaining({ windowStart }),
    )
  })

  it('returns null when settings disabled', async () => {
    vi.mocked(clearAuctionWindowService).mockResolvedValue(makeServiceResult({ settingsDisabled: true }))

    const result = await clearAuctionWindow({ locale: 'africa_west', placement: 'spotlight' })

    expect(result).toBeNull()
  })
})

function makeServiceResult(overrides: Partial<ServiceClearResult> = {}): ServiceClearResult {
  return { ...baseServiceResult(), ...overrides }
}

function baseServiceResult(): ServiceClearResult {
  return {
    locale: 'africa_west',
    placement: 'spotlight',
    windowStart: new Date('2025-01-01T00:00:00Z'),
    boostStartsAt: new Date('2025-01-01T00:15:00Z'),
    boostEndsAt: new Date('2025-01-01T02:15:00Z'),
    nextWindowStart: new Date('2025-01-01T00:15:00Z'),
    activatedSessionIds: [] as string[],
    refundedSessionIds: [] as string[],
    rolledOverSessionIds: [] as string[],
    settingsDisabled: false,
  }
}
