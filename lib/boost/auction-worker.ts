import {
  BOOST_AUCTION_LOCALES,
  BOOST_AUCTION_PLACEMENTS,
  type AuctionLocale,
  type AuctionPlacement,
} from './bid-service'
import { clearAuctionWindow as clearAuctionWindowService } from './auction-clearing-service'

export type ClearAuctionWindowOptions = {
  locale: AuctionLocale
  placement: AuctionPlacement
  now?: Date
  windowStart?: Date
}

export type ClearAuctionWindowResult = {
  locale: AuctionLocale
  placement: AuctionPlacement
  windowStart: Date
  winnersCleared: number
  rollovers: number
  refunded: number
  failures: number
  totalBids: number
}

export async function clearDueAuctionWindows(options: { now?: Date } = {}) {
  const results: ClearAuctionWindowResult[] = []

  for (const locale of BOOST_AUCTION_LOCALES) {
    for (const placement of BOOST_AUCTION_PLACEMENTS) {
      const result = await clearAuctionWindow({ locale, placement, now: options.now })
      if (result) {
        results.push(result)
      }
    }
  }

  return results
}

export async function clearAuctionWindow(options: ClearAuctionWindowOptions): Promise<ClearAuctionWindowResult | null> {
  const { locale, placement } = options
  const referenceTime = options.now ?? new Date()

  const serviceResult = await clearAuctionWindowService({
    locale,
    placement,
    windowStart: options.windowStart,
    referenceTime,
  })

  if (serviceResult.settingsDisabled) {
    return null
  }

  const winnersCleared = serviceResult.activatedSessionIds.length
  const rollovers = serviceResult.rolledOverSessionIds.length
  const refunded = serviceResult.refundedSessionIds.length
  const totalBids = winnersCleared + rollovers + refunded

  return {
    locale,
    placement,
    windowStart: serviceResult.windowStart,
    winnersCleared,
    rollovers,
    refunded,
    failures: 0,
    totalBids,
  }
}
