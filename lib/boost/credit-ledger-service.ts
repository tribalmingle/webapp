import { Collection, Filter, ObjectId, type UpdateFilter } from 'mongodb'

import type { EntitlementDocument } from '@/lib/data/types'
import { getMongoDb } from '@/lib/mongodb'

const COLLECTION_NAME = 'entitlements'
const BOOST_FEATURE_KEY = 'boost_credits'
const REFERRAL_SOURCE: EntitlementDocument['source'] = 'referral'
const CREDIT_PRIORITY: ReadonlyArray<EntitlementDocument['source']> = ['referral', 'promotion', 'admin', 'event', 'subscription', 'auction']

export class InsufficientBoostCreditsError extends Error {
  constructor(message = 'Not enough boost credits') {
    super(message)
    this.name = 'InsufficientBoostCreditsError'
  }
}

type GrantCreditsInput = {
  userId: string | ObjectId
  amount: number
  reason?: string
}

type DebitCreditsInput = {
  userId: string | ObjectId
  amount: number
  reason?: string
}

export async function grantReferralBoostCredits(input: GrantCreditsInput) {
  if (input.amount <= 0 || !Number.isInteger(input.amount)) {
    throw new Error('Amount must be a positive integer')
  }
  const db = await getMongoDb()
  const collection = db.collection<EntitlementDocument>(COLLECTION_NAME)
  const userId = toObjectId(input.userId)
  const now = new Date()

  await collection.updateOne(
    { userId, featureKey: BOOST_FEATURE_KEY, source: REFERRAL_SOURCE },
    {
      $setOnInsert: {
        userId,
        source: REFERRAL_SOURCE,
        featureKey: BOOST_FEATURE_KEY,
        renewalSchedule: 'one_time',
        quantity: 0,
        remaining: 0,
        createdAt: now,
      },
      $inc: { quantity: input.amount, remaining: input.amount },
      $push: { audit: buildAuditEntry(input.amount, input.reason ?? 'referral_reward', now) },
      $set: { updatedAt: now },
    },
    { upsert: true },
  )

  return getBoostCreditBalance(userId)
}

export async function debitBoostCredits(input: DebitCreditsInput) {
  if (input.amount <= 0 || !Number.isInteger(input.amount)) {
    throw new Error('Amount must be a positive integer')
  }
  const db = await getMongoDb()
  const collection = db.collection<EntitlementDocument>(COLLECTION_NAME)
  const userId = toObjectId(input.userId)
  const buckets = await fetchCreditBuckets(collection, userId)

  let remaining = input.amount
  const updates: { filter: Filter<EntitlementDocument>; update: UpdateFilter<EntitlementDocument> }[] = []
  const now = new Date()

  for (const bucket of buckets) {
    if (remaining <= 0) break
    if (!bucket.remaining || bucket.remaining <= 0) continue

    const deduction = Math.min(bucket.remaining, remaining)
    remaining -= deduction

    updates.push({
      filter: { _id: bucket._id },
      update: {
        $inc: { remaining: -deduction },
        $push: { audit: buildAuditEntry(-deduction, input.reason ?? 'boost_bid', now) },
        $set: { updatedAt: now },
      },
    })
  }

  if (remaining > 0) {
    throw new InsufficientBoostCreditsError()
  }

  if (updates.length > 0) {
    await collection.bulkWrite(updates.map(({ filter, update }) => ({ updateOne: { filter, update } })))
  }

  const balance = await getBoostCreditBalance(userId)
  return { debited: input.amount, remaining: balance }
}

export async function getBoostCreditBalance(userId: string | ObjectId) {
  const db = await getMongoDb()
  const collection = db.collection<EntitlementDocument>(COLLECTION_NAME)
  const docs = await collection
    .find({ userId: toObjectId(userId), featureKey: BOOST_FEATURE_KEY }, { projection: { remaining: 1 } })
    .toArray()
  return docs.reduce((total, doc) => total + (doc.remaining ?? 0), 0)
}

async function fetchCreditBuckets(collection: EntitlementCollection, userId: ObjectId) {
  const cursor = collection.find({ userId, featureKey: BOOST_FEATURE_KEY })
  const docs = await cursor.toArray()
  return docs.sort((a, b) => {
    const priorityDiff = getSourcePriority(a.source) - getSourcePriority(b.source)
    if (priorityDiff !== 0) return priorityDiff

    const expiryDiff = (a.expiresAt?.getTime() ?? Number.POSITIVE_INFINITY) - (b.expiresAt?.getTime() ?? Number.POSITIVE_INFINITY)
    if (expiryDiff !== 0) return expiryDiff

    return (a.createdAt?.getTime() ?? 0) - (b.createdAt?.getTime() ?? 0)
  })
}

function getSourcePriority(source: EntitlementDocument['source']) {
  const index = CREDIT_PRIORITY.indexOf(source)
  return index === -1 ? CREDIT_PRIORITY.length : index
}

function buildAuditEntry(delta: number, reason: string, at: Date) {
  return { at, delta, reason }
}

function toObjectId(value: string | ObjectId) {
  if (value instanceof ObjectId) {
    return value
  }
  return new ObjectId(value)
}

type EntitlementCollection = Collection<EntitlementDocument>
