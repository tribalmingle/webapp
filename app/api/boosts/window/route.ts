import { ObjectId } from 'mongodb'
import { NextResponse } from 'next/server'
import { z } from 'zod'

import { getCurrentUser } from '@/lib/auth'
import { getMongoDb } from '@/lib/mongodb'
import type { BoostSessionDocument } from '@/lib/data/types'
import {
  BOOST_AUCTION_LOCALES,
  BOOST_AUCTION_PLACEMENTS,
  type AuctionLocale,
  type AuctionPlacement,
} from '@/lib/boost/auction-constants'
import {
  computeAuctionWindowStart,
  computeBoostTiming,
  getAuctionSettings,
  normalizeLocale,
} from '@/lib/boost/bid-service'
import { getBoostCreditBalance } from '@/lib/boost/credit-ledger-service'

const querySchema = z.object({
  locale: z.enum(BOOST_AUCTION_LOCALES).default('africa_west'),
  placement: z.enum(BOOST_AUCTION_PLACEMENTS).default('spotlight'),
})

const MEMBER_BID_STATUSES: BoostSessionDocument['status'][] = ['pending', 'active', 'cleared', 'expired', 'refunded']

export async function GET(request: Request) {
  const authUser = await getCurrentUser()

  if (!authUser) {
    return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 })
  }

  const url = new URL(request.url)
  const validation = querySchema.safeParse(Object.fromEntries(url.searchParams))

  if (!validation.success) {
    return NextResponse.json({ success: false, errors: validation.error.flatten().fieldErrors }, { status: 400 })
  }

  const locale = normalizeLocale(validation.data.locale) as AuctionLocale
  const placement = validation.data.placement as AuctionPlacement

  const settings = await getAuctionSettings(locale, authUser.userId, placement)

  if (!settings.enabled) {
    return NextResponse.json({ success: false, error: 'Auction disabled for locale' }, { status: 409 })
  }

  const now = new Date()
  const windowStart = computeAuctionWindowStart(now, settings.windowMinutes)
  const timings = computeBoostTiming(windowStart, settings)
  const nextWindowStart = new Date(windowStart.getTime() + settings.windowMinutes * 60 * 1000)
  const nextTimings = computeBoostTiming(nextWindowStart, settings)

  const db = await getMongoDb()
  const collection = db.collection<BoostSessionDocument>('boost_sessions')
  const userObjectId = new ObjectId(authUser.userId)

  const [pendingBid, nextPendingBid, activeSessions, recentHistory, credits] = await Promise.all([
    collection.findOne(
      { userId: userObjectId, placement, locale, auctionWindowStart: windowStart, status: 'pending' },
      { sort: { createdAt: -1 } },
    ),
    collection.findOne(
      { userId: userObjectId, placement, locale, auctionWindowStart: nextWindowStart, status: 'pending' },
      { sort: { createdAt: -1 } },
    ),
    collection
      .find({
        userId: userObjectId,
        placement,
        locale,
        status: 'active',
        startedAt: { $lte: now },
        endsAt: { $gte: now },
      })
      .sort({ startedAt: -1 })
      .limit(5)
      .toArray(),
    collection
      .find({
        userId: userObjectId,
        placement,
        locale,
        status: { $in: ['cleared', 'expired', 'refunded'] },
      })
      .sort({ updatedAt: -1 })
      .limit(10)
      .toArray(),
    getBoostCreditBalance(authUser.userId),
  ])

  const response = {
    success: true,
    window: {
      locale,
      placement,
      windowStart: windowStart.toISOString(),
      boostStartsAt: timings.boostStartsAt.toISOString(),
      boostEndsAt: timings.boostEndsAt.toISOString(),
      minBidCredits: settings.minBidCredits,
      maxWinners: settings.maxWinners,
    },
    nextWindow: {
      windowStart: nextWindowStart.toISOString(),
      boostStartsAt: nextTimings.boostStartsAt.toISOString(),
      boostEndsAt: nextTimings.boostEndsAt.toISOString(),
    },
    credits: {
      available: credits,
      minBidCredits: settings.minBidCredits,
      suggestedBidCredits: Math.max(settings.minBidCredits * 2, settings.minBidCredits),
    },
    bids: {
      pending: pendingBid ? serializeBid(pendingBid) : null,
      nextPending: nextPendingBid ? serializeBid(nextPendingBid) : null,
      active: activeSessions.map(serializeBid),
      history: recentHistory.map(serializeBid),
    },
  }

  return NextResponse.json(response)
}

function serializeBid(doc: BoostSessionDocument) {
  if (!MEMBER_BID_STATUSES.includes(doc.status)) {
    throw new Error('Unexpected boost session status for serialization')
  }
  const sessionId = doc._id?.toHexString()
  if (!sessionId) {
    throw new Error('Boost session missing _id')
  }

  return {
    sessionId,
    status: doc.status,
    bidAmountCredits: doc.bidAmountCredits ?? doc.budgetCredits ?? 0,
    auctionWindowStart: doc.auctionWindowStart?.toISOString() ?? null,
    boostStartsAt: doc.startedAt?.toISOString() ?? null,
    boostEndsAt: doc.endsAt?.toISOString() ?? null,
    autoRollover: Boolean(doc.metadata?.autoRollover),
    createdAt: doc.createdAt?.toISOString() ?? null,
    updatedAt: doc.updatedAt?.toISOString() ?? null,
  }
}
