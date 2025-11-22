import { ObjectId } from 'mongodb'

import type { BoostSessionDocument } from '@/lib/data/types'
import { getMongoDb } from '@/lib/mongodb'
import { getBoostCreditBalance, InsufficientBoostCreditsError } from '@/lib/boost/credit-ledger-service'
import {
  BOOST_AUCTION_LOCALES,
  BOOST_AUCTION_PLACEMENTS,
  type AuctionLocale,
  type AuctionPlacement,
} from '@/lib/boost/auction-constants'
import { getLaunchDarklyClient } from '@/lib/launchdarkly/server'

export { BOOST_AUCTION_LOCALES, BOOST_AUCTION_PLACEMENTS, type AuctionLocale, type AuctionPlacement }

const BOOST_COLLECTION = 'boost_sessions'
const DEFAULT_MIN_BID_CREDITS = 5
const MAX_BID_CREDITS = 500
const DEFAULT_WINDOW_MINUTES = 15
const DEFAULT_DURATION_MINUTES = 120
const DEFAULT_MAX_WINNERS = 5
const AUCTION_FLAG_KEY = 'boosts.auction_enabled'

type AuctionFlagValue =
  | boolean
  | {
      enabled?: boolean
      minBidCredits?: number
      windowMinutes?: number
      durationMinutes?: number
      maxWinners?: number
      locales?: Record<
        string,
        {
          enabled?: boolean
          minBidCredits?: number
          windowMinutes?: number
          durationMinutes?: number
          maxWinners?: number
        }
      >
    }

export type AuctionRuntimeSettings = {
  enabled: boolean
  minBidCredits: number
  windowMinutes: number
  durationMinutes: number
  maxWinners: number
}

export type SubmitBoostBidInput = {
  userId: string | ObjectId
  placement: AuctionPlacement
  locale: AuctionLocale
  bidAmountCredits: number
  autoRollover?: boolean
  metadata?: Record<string, unknown>
}

export type SubmitBoostBidResult = {
  sessionId: ObjectId
  status: BoostSessionDocument['status']
  auctionWindowStart: Date
  boostStartsAt: Date
  boostEndsAt: Date
  bidAmountCredits: number
  availableCredits: number
}

export class BoostAuctionDisabledError extends Error {
  constructor(message = 'Boost auctions are not enabled for this locale') {
    super(message)
    this.name = 'BoostAuctionDisabledError'
  }
}

export class BoostBidTooLowError extends Error {
  constructor(message = 'Bid is below the minimum required amount') {
    super(message)
    this.name = 'BoostBidTooLowError'
  }
}

export class BoostBidConflictError extends Error {
  constructor(message = 'You already have a bid in this auction window') {
    super(message)
    this.name = 'BoostBidConflictError'
  }
}

export class BoostBidValidationError extends Error {
  constructor(message = 'Bid parameters are invalid') {
    super(message)
    this.name = 'BoostBidValidationError'
  }
}

export async function submitBoostBid(input: SubmitBoostBidInput, options: { now?: Date } = {}): Promise<SubmitBoostBidResult> {
  validateBidAmount(input.bidAmountCredits)

  const normalizedLocale = normalizeLocale(input.locale)
  if (!BOOST_AUCTION_LOCALES.includes(normalizedLocale as AuctionLocale)) {
    throw new Error('Unsupported auction locale')
  }

  const ldSettings = await getAuctionSettings(normalizedLocale, input.userId, input.placement)
  if (!ldSettings.enabled) {
    throw new BoostAuctionDisabledError()
  }

  if (input.bidAmountCredits < ldSettings.minBidCredits) {
    throw new BoostBidTooLowError(`Minimum bid for this locale is ${ldSettings.minBidCredits} credits`)
  }

  const availableCredits = await getBoostCreditBalance(input.userId)
  if (availableCredits < input.bidAmountCredits) {
    throw new InsufficientBoostCreditsError()
  }

  const now = options.now ?? new Date()
  const auctionWindowStart = computeAuctionWindowStart(now, ldSettings.windowMinutes)
  const { boostStartsAt, boostEndsAt } = computeBoostTiming(auctionWindowStart, ldSettings)

  const db = await getMongoDb()
  const collection = db.collection<BoostSessionDocument>(BOOST_COLLECTION)
  const userObjectId = toObjectId(input.userId)

  const existingBid = await collection.findOne({
    userId: userObjectId,
    placement: input.placement,
    locale: normalizedLocale,
    auctionWindowStart,
    status: { $in: ['pending', 'active'] },
  })

  if (existingBid) {
    throw new BoostBidConflictError()
  }

  const doc: BoostSessionDocument = {
    _id: new ObjectId(),
    userId: userObjectId,
    placement: input.placement,
    locale: normalizedLocale,
    startedAt: boostStartsAt,
    endsAt: boostEndsAt,
    budgetCredits: input.bidAmountCredits,
    bidAmountCredits: input.bidAmountCredits,
    auctionWindowStart,
    status: 'pending',
    source: 'auction',
    metadata: {
      autoRollover: input.autoRollover ?? false,
      ...(input.metadata ?? {}),
    },
    createdAt: now,
    updatedAt: now,
  }

  const sessionId = doc._id ?? new ObjectId()
  doc._id = sessionId

  await collection.insertOne(doc)

  return {
    sessionId,
    status: doc.status,
    auctionWindowStart,
    boostStartsAt,
    boostEndsAt,
    bidAmountCredits: input.bidAmountCredits,
    availableCredits,
  }
}

function validateBidAmount(amount: number) {
  if (!Number.isInteger(amount) || amount <= 0) {
    throw new BoostBidValidationError('Bid amount must be a positive integer')
  }
  if (amount > MAX_BID_CREDITS) {
    throw new BoostBidValidationError(`Bid amount exceeds maximum of ${MAX_BID_CREDITS} credits`)
  }
}

export async function getAuctionSettings(locale: AuctionLocale, userId: string | ObjectId, placement: AuctionPlacement): Promise<AuctionRuntimeSettings> {
  const client = await getLaunchDarklyClient()
  const userKey = typeof userId === 'string' ? userId : userId.toHexString()
  const flagValue = (await client.variation(AUCTION_FLAG_KEY, { key: userKey, custom: { locale, placement } }, false)) as AuctionFlagValue
  return interpretFlagValue(flagValue, locale)
}

export function interpretFlagValue(value: AuctionFlagValue, locale: string): AuctionRuntimeSettings {
  if (typeof value === 'boolean') {
    return {
      enabled: value,
      minBidCredits: DEFAULT_MIN_BID_CREDITS,
      windowMinutes: DEFAULT_WINDOW_MINUTES,
      durationMinutes: DEFAULT_DURATION_MINUTES,
      maxWinners: DEFAULT_MAX_WINNERS,
    }
  }

  const localeOverrides = value.locales?.[locale]

  return {
    enabled: localeOverrides?.enabled ?? value.enabled ?? true,
    minBidCredits: localeOverrides?.minBidCredits ?? value.minBidCredits ?? DEFAULT_MIN_BID_CREDITS,
    windowMinutes: localeOverrides?.windowMinutes ?? value.windowMinutes ?? DEFAULT_WINDOW_MINUTES,
    durationMinutes: localeOverrides?.durationMinutes ?? value.durationMinutes ?? DEFAULT_DURATION_MINUTES,
    maxWinners: localeOverrides?.maxWinners ?? value.maxWinners ?? DEFAULT_MAX_WINNERS,
  }
}

export function normalizeLocale(locale: string): AuctionLocale {
  return locale.toLowerCase().replace(/[^a-z0-9]+/g, '_') as AuctionLocale
}

export function computeAuctionWindowStart(reference: Date, windowMinutes: number) {
  const windowMs = windowMinutes * 60 * 1000
  return new Date(Math.floor(reference.getTime() / windowMs) * windowMs)
}

export function computeBoostTiming(windowStart: Date, settings: Pick<AuctionRuntimeSettings, 'windowMinutes' | 'durationMinutes'>) {
  const boostStartsAt = new Date(windowStart.getTime() + settings.windowMinutes * 60 * 1000)
  const boostEndsAt = new Date(boostStartsAt.getTime() + settings.durationMinutes * 60 * 1000)
  return { boostStartsAt, boostEndsAt }
}

function toObjectId(value: string | ObjectId) {
  if (value instanceof ObjectId) {
    return value
  }
  return new ObjectId(value)
}
