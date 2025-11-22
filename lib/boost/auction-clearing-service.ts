import { AnyBulkWriteOperation, ObjectId } from 'mongodb'

import type { BoostSessionDocument } from '@/lib/data/types'
import { getMongoDb } from '@/lib/mongodb'
import {
  type AuctionLocale,
  type AuctionPlacement,
  computeAuctionWindowStart,
  computeBoostTiming,
  getAuctionSettings,
} from '@/lib/boost/bid-service'
import { debitBoostCredits, InsufficientBoostCreditsError } from '@/lib/boost/credit-ledger-service'
import { trackServerEvent } from '@/lib/analytics/segment'

const BOOST_COLLECTION = 'boost_sessions'
const WORKER_FLAG_USER_KEY = 'boosts-worker'

export type ClearAuctionWindowInput = {
  locale: AuctionLocale
  placement: AuctionPlacement
  windowStart?: Date
  referenceTime?: Date
}

export type ClearAuctionWindowResult = {
  locale: AuctionLocale
  placement: AuctionPlacement
  windowStart: Date
  boostStartsAt: Date
  boostEndsAt: Date
  nextWindowStart: Date
  activatedSessionIds: string[]
  refundedSessionIds: string[]
  rolledOverSessionIds: string[]
  settingsDisabled: boolean
}

type RefundReasonStats = {
  insufficientCredits: number
  lostAuction: number
}

export async function clearAuctionWindow(input: ClearAuctionWindowInput): Promise<ClearAuctionWindowResult> {
  const settings = await getAuctionSettings(input.locale, WORKER_FLAG_USER_KEY, input.placement)

  if (!settings.enabled) {
    const windowStart = input.windowStart ?? new Date()
    const timings = computeBoostTiming(windowStart, settings)
    const disabledResult: ClearAuctionWindowResult = {
      locale: input.locale,
      placement: input.placement,
      windowStart,
      boostStartsAt: timings.boostStartsAt,
      boostEndsAt: timings.boostEndsAt,
      nextWindowStart: new Date(windowStart.getTime() + settings.windowMinutes * 60 * 1000),
      activatedSessionIds: [],
      refundedSessionIds: [],
      rolledOverSessionIds: [],
      settingsDisabled: true,
    }

    await emitClearingAnalytics(disabledResult, { insufficientCredits: 0, lostAuction: 0 })
    return disabledResult
  }

  const referenceTime = input.referenceTime ?? new Date()
  const windowStart = input.windowStart ?? computeAuctionWindowStart(referenceTime, settings.windowMinutes)
  const { boostStartsAt, boostEndsAt } = computeBoostTiming(windowStart, settings)
  const nextWindowStart = new Date(windowStart.getTime() + settings.windowMinutes * 60 * 1000)

  const db = await getMongoDb()
  const collection = db.collection<BoostSessionDocument>(BOOST_COLLECTION)
  const bids = await collection
    .find({ locale: input.locale, placement: input.placement, status: 'pending', auctionWindowStart: windowStart })
    .sort({ bidAmountCredits: -1, createdAt: 1 })
    .toArray()

  const activatedSessionIds: string[] = []
  const refundedSessionIds: string[] = []
  const rolledOverSessionIds: string[] = []
  const bulkOperations: AnyBulkWriteOperation<BoostSessionDocument>[] = []
  const now = new Date()
  const refundStats: RefundReasonStats = { insufficientCredits: 0, lostAuction: 0 }
  const winners = bids.slice(0, settings.maxWinners)
  const remainder = bids.slice(settings.maxWinners)

  for (const bid of winners) {
    const amount = getBidAmount(bid)

    try {
      await debitBoostCredits({ userId: bid.userId, amount, reason: 'boost_auction_win' })
      activatedSessionIds.push(bid._id.toHexString())
      bulkOperations.push({
        updateOne: {
          filter: { _id: bid._id },
          update: {
            $set: {
              status: 'active',
              startedAt: boostStartsAt,
              endsAt: boostEndsAt,
              updatedAt: now,
            },
            $setOnInsert: {
              userId: bid.userId,
            },
          },
        },
      })
    } catch (error) {
      if (error instanceof InsufficientBoostCreditsError) {
        refundStats.insufficientCredits += 1
        refundedSessionIds.push(bid._id.toHexString())
        bulkOperations.push({
          updateOne: {
            filter: { _id: bid._id },
            update: {
              $set: {
                status: 'refunded',
                metadata: enrichMetadata(bid, { lastFailure: 'insufficient_credits', refundedAt: now }),
                updatedAt: now,
              },
            },
          },
        })
      } else {
        throw error
      }
    }
  }

  for (const bid of remainder) {
    if (bid.metadata?.autoRollover) {
      rolledOverSessionIds.push(bid._id.toHexString())
      bulkOperations.push({
        updateOne: {
          filter: { _id: bid._id },
          update: {
            $set: {
              auctionWindowStart: nextWindowStart,
              metadata: enrichMetadata(bid, { rolloverCount: (bid.metadata?.rolloverCount ?? 0) + 1 }),
              updatedAt: now,
            },
          },
        },
      })
    } else {
      refundStats.lostAuction += 1
      refundedSessionIds.push(bid._id.toHexString())
      bulkOperations.push({
        updateOne: {
          filter: { _id: bid._id },
          update: {
            $set: {
              status: 'refunded',
              metadata: enrichMetadata(bid, { refundedAt: now }),
              updatedAt: now,
            },
          },
        },
      })
    }
  }

  if (bulkOperations.length > 0) {
    await collection.bulkWrite(bulkOperations, { ordered: false })
  }

  const result: ClearAuctionWindowResult = {
    locale: input.locale,
    placement: input.placement,
    windowStart,
    boostStartsAt,
    boostEndsAt,
    nextWindowStart,
    activatedSessionIds,
    refundedSessionIds,
    rolledOverSessionIds,
    settingsDisabled: false,
  }

  await emitClearingAnalytics(result, refundStats)
  return result
}

function getBidAmount(bid: BoostSessionDocument) {
  return bid.bidAmountCredits ?? bid.budgetCredits ?? 0
}

function enrichMetadata(bid: BoostSessionDocument, updates: Record<string, unknown>) {
  return {
    ...(bid.metadata ?? {}),
    ...updates,
  }
}

async function emitClearingAnalytics(result: ClearAuctionWindowResult, refundStats: RefundReasonStats) {
  await trackWithGuard('boost.auction.cleared', {
    locale: result.locale,
    placement: result.placement,
    windowStart: result.windowStart.toISOString(),
    boostStartsAt: result.boostStartsAt.toISOString(),
    boostEndsAt: result.boostEndsAt.toISOString(),
    nextWindowStart: result.nextWindowStart.toISOString(),
    winners: result.activatedSessionIds.length,
    refunds: result.refundedSessionIds.length,
    rollovers: result.rolledOverSessionIds.length,
    settingsDisabled: result.settingsDisabled,
  })

  if (result.refundedSessionIds.length > 0) {
    await trackWithGuard('boost.auction.refunded', {
      locale: result.locale,
      placement: result.placement,
      windowStart: result.windowStart.toISOString(),
      refundCount: result.refundedSessionIds.length,
      insufficientCredits: refundStats.insufficientCredits,
      lostAuction: refundStats.lostAuction,
    })
  }
}

async function trackWithGuard(event: string, properties: Record<string, unknown>) {
  try {
    await trackServerEvent({
      anonymousId: WORKER_FLAG_USER_KEY,
      event,
      properties,
    })
  } catch (error) {
    console.warn('[boosts] failed to track Segment event', event, error)
  }
}
