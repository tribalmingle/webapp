import { NextResponse } from 'next/server'
import { z } from 'zod'

import { getCurrentUser } from '@/lib/auth'
import { getMongoDb } from '@/lib/mongodb'
import type { BoostSessionDocument } from '@/lib/data/types'
import {
  BOOST_AUCTION_LOCALES,
  BOOST_AUCTION_PLACEMENTS,
  AuctionLocale,
  AuctionPlacement,
  computeAuctionWindowStart,
  computeBoostTiming,
  getAuctionSettings,
  normalizeLocale,
} from '@/lib/boost/bid-service'
import { clearAuctionWindow } from '@/lib/boost/auction-clearing-service'

const querySchema = z.object({
  locale: z.enum(BOOST_AUCTION_LOCALES).default('africa_west'),
  placement: z.enum(BOOST_AUCTION_PLACEMENTS).default('spotlight'),
})

const bodySchema = z.object({
  locale: z.enum(BOOST_AUCTION_LOCALES),
  placement: z.enum(BOOST_AUCTION_PLACEMENTS),
  windowStart: z.string().datetime().optional(),
  referenceTime: z.string().datetime().optional(),
})

export async function GET(request: Request) {
  const authUser = await getCurrentUser()

  if (!authUser) {
    return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 })
  }

  if (!userIsAdmin(authUser)) {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
  }

  const url = new URL(request.url)
  const validation = querySchema.safeParse(Object.fromEntries(url.searchParams))

  if (!validation.success) {
    return NextResponse.json({ success: false, errors: validation.error.flatten().fieldErrors }, { status: 400 })
  }

  const locale = normalizeLocale(validation.data.locale) as AuctionLocale
  const placement = validation.data.placement as AuctionPlacement
  const now = new Date()
  const settings = await getAuctionSettings(locale, authUser.userId, placement)

  if (!settings.enabled) {
    return NextResponse.json({ success: false, error: 'Auction disabled for locale' }, { status: 409 })
  }

  const windowStart = computeAuctionWindowStart(now, settings.windowMinutes)
  const timings = computeBoostTiming(windowStart, settings)
  const nextWindowStart = new Date(windowStart.getTime() + settings.windowMinutes * 60 * 1000)
  const nextTimings = computeBoostTiming(nextWindowStart, settings)

  const db = await getMongoDb()
  const collection = db.collection<BoostSessionDocument>('boost_sessions')

  const pendingBids = await collection
    .find({ locale, placement, auctionWindowStart: windowStart, status: 'pending' })
    .sort({ bidAmountCredits: -1, createdAt: 1 })
    .limit(50)
    .toArray()

  const nextWindowQueue = await collection
    .find({ locale, placement, auctionWindowStart: nextWindowStart, status: 'pending' })
    .sort({ bidAmountCredits: -1, createdAt: 1 })
    .limit(50)
    .toArray()

  const activeSessions = await collection
    .find({
      locale,
      placement,
      status: 'active',
      startedAt: { $lte: now },
      endsAt: { $gte: now },
    })
    .sort({ bidAmountCredits: -1 })
    .limit(20)
    .toArray()

  return NextResponse.json({
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
      pendingCount: nextWindowQueue.length,
    },
    pendingBids: pendingBids.map(serializeBid),
    nextWindowBids: nextWindowQueue.map(serializeBid),
    activeSessions: activeSessions.map(serializeBid),
  })
}

export async function POST(request: Request) {
  const authUser = await getCurrentUser()

  if (!authUser) {
    return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 })
  }

  if (!userIsAdmin(authUser)) {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
  }

  let json: unknown

  try {
    json = await request.json()
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 })
  }

  const validation = bodySchema.safeParse(json)

  if (!validation.success) {
    return NextResponse.json({ success: false, errors: validation.error.flatten().fieldErrors }, { status: 400 })
  }

  const locale = normalizeLocale(validation.data.locale) as AuctionLocale
  const placement = validation.data.placement as AuctionPlacement
  const windowStart = validation.data.windowStart ? new Date(validation.data.windowStart) : undefined
  const referenceTime = validation.data.referenceTime ? new Date(validation.data.referenceTime) : undefined

  const result = await clearAuctionWindow({
    locale,
    placement,
    windowStart,
    referenceTime: referenceTime ?? new Date(),
  })

  const serializedResult = serializeClearResult(result)

  if (result.settingsDisabled) {
    return NextResponse.json(
      { success: false, error: 'Auction disabled for locale', result: serializedResult },
      { status: 409 },
    )
  }

  return NextResponse.json({ success: true, result: serializedResult })
}

function serializeBid(doc: BoostSessionDocument) {
  const sessionId = doc._id?.toHexString()
  if (!sessionId) {
    throw new Error('Boost session missing _id')
  }
  return {
    sessionId,
    userId: doc.userId.toString(),
    bidAmountCredits: doc.bidAmountCredits ?? doc.budgetCredits ?? 0,
    status: doc.status,
    auctionWindowStart: doc.auctionWindowStart?.toISOString() ?? null,
    autoRollover: Boolean(doc.metadata?.autoRollover),
    rolloverCount: doc.metadata?.rolloverCount ?? 0,
    createdAt: doc.createdAt?.toISOString() ?? null,
    startedAt: doc.startedAt?.toISOString() ?? null,
    endsAt: doc.endsAt?.toISOString() ?? null,
  }
}

function serializeClearResult(result: {
  windowStart: Date
  boostStartsAt: Date
  boostEndsAt: Date
  nextWindowStart: Date
  activatedSessionIds: string[]
  refundedSessionIds: string[]
  rolledOverSessionIds: string[]
  locale: string
  placement: string
}) {
  return {
    locale: result.locale,
    placement: result.placement,
    windowStart: result.windowStart.toISOString(),
    boostStartsAt: result.boostStartsAt.toISOString(),
    boostEndsAt: result.boostEndsAt.toISOString(),
    nextWindowStart: result.nextWindowStart.toISOString(),
    activatedSessionIds: result.activatedSessionIds,
    refundedSessionIds: result.refundedSessionIds,
    rolledOverSessionIds: result.rolledOverSessionIds,
  }
}

function userIsAdmin(user: { roles?: string[] | undefined }) {
  if (!Array.isArray(user.roles)) {
    return false
  }
  return user.roles.includes('admin') || user.roles.includes('ops')
}
