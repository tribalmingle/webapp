import type { Db } from 'mongodb'

import type { AnalyticsSnapshotDocument } from '@/lib/data/types'
import { getMongoDb } from '@/lib/mongodb'

export const SNAPSHOT_TYPES = ['activation', 'retention', 'revenue', 'trust'] as const
export type SnapshotType = (typeof SNAPSHOT_TYPES)[number]

export const SNAPSHOT_RANGES = ['daily', 'weekly', 'monthly'] as const
export type SnapshotRange = (typeof SNAPSHOT_RANGES)[number]

const DEFAULT_LIMIT = 7

export type MaterializeSnapshotOptions = {
  type: SnapshotType
  range: SnapshotRange
  referenceDate?: Date | string | number
  locale?: string | null
}

export type ListSnapshotsOptions = {
  type?: SnapshotType
  range?: SnapshotRange
  limit?: number
}

export type SerializedSnapshot = ReturnType<typeof serializeAnalyticsSnapshot>

type SnapshotUpsertPayload = Omit<AnalyticsSnapshotDocument, '_id' | 'createdAt' | 'updatedAt'>

export async function materializeAnalyticsSnapshot(options: MaterializeSnapshotOptions) {
  const db = await getMongoDb()
  const { type, range } = options
  const { windowStart, windowEnd } = resolveWindow(range, options.referenceDate)
  const metrics = await collectMetrics(db, type, windowStart, windowEnd)
  const dimensions: AnalyticsSnapshotDocument['dimensions'] = options.locale
    ? { locale: options.locale }
    : {}

  const now = new Date()
  const snapshotPayload: SnapshotUpsertPayload = {
    type,
    range,
    windowStart,
    windowEnd,
    dimensions,
    metrics,
    source: 'warehouse' as const,
    generatedAt: now,
    ...(options.locale ? { notes: `Filtered for locale ${options.locale}` } : {}),
  }

  const collection = db.collection<AnalyticsSnapshotDocument>('analytics_snapshots')
  const result = await collection.findOneAndUpdate(
    { type, range, windowStart },
    {
      $set: {
        ...snapshotPayload,
        updatedAt: now,
      },
      $setOnInsert: { createdAt: now },
    },
    { upsert: true, returnDocument: 'after' },
  )

  if (result) {
    return result
  }

  // Should not happen because of upsert, but return synthesized payload for completeness.
  return {
    ...snapshotPayload,
    createdAt: now,
    updatedAt: now,
  } as AnalyticsSnapshotDocument
}

export async function listAnalyticsSnapshots(options: ListSnapshotsOptions = {}) {
  const db = await getMongoDb()
  const collection = db.collection<AnalyticsSnapshotDocument>('analytics_snapshots')
  const filter: Record<string, unknown> = {}

  if (options.type) {
    filter.type = options.type
  }

  if (options.range) {
    filter.range = options.range
  }

  const limit = Math.min(Math.max(options.limit ?? DEFAULT_LIMIT, 1), 30)

  return collection.find(filter).sort({ windowStart: -1 }).limit(limit).toArray()
}

export function serializeAnalyticsSnapshot(doc: AnalyticsSnapshotDocument) {
  return {
    id: doc._id?.toString() ?? null,
    type: doc.type,
    range: doc.range,
    windowStart: doc.windowStart.toISOString(),
    windowEnd: doc.windowEnd.toISOString(),
    dimensions: doc.dimensions,
    metrics: doc.metrics,
    source: doc.source,
    generatedAt: doc.generatedAt.toISOString(),
    notes: doc.notes ?? null,
  }
}

async function collectMetrics(db: Db, type: SnapshotType, windowStart: Date, windowEnd: Date) {
  switch (type) {
    case 'activation':
      return collectActivationMetrics(db, windowStart, windowEnd)
    case 'retention':
      return collectRetentionMetrics(db, windowStart, windowEnd)
    case 'revenue':
      return collectRevenueMetrics(db, windowStart, windowEnd)
    case 'trust':
      return collectTrustMetrics(db, windowStart, windowEnd)
    default:
      return {}
  }
}

async function collectActivationMetrics(db: Db, windowStart: Date, windowEnd: Date) {
  const [newSignups, profileCompletions, guardianInvites, livenessSessions, livenessPassed, referralsCreated, boostBids] =
    await Promise.all([
      countRange(db, 'users', 'createdAt', windowStart, windowEnd),
      countRange(db, 'profiles', 'createdAt', windowStart, windowEnd),
      countRange(db, 'guardian_invite_requests', 'createdAt', windowStart, windowEnd),
      countRange(db, 'liveness_sessions', 'createdAt', windowStart, windowEnd),
      countRange(db, 'liveness_sessions', 'updatedAt', windowStart, windowEnd, { status: 'passed' }),
      countRange(db, 'referrals', 'createdAt', windowStart, windowEnd),
      countRange(db, 'boost_sessions', 'createdAt', windowStart, windowEnd, { source: { $in: ['auction', 'referral'] } }),
    ])

  const profileCompletionRate = calculateRate(profileCompletions, newSignups)
  const livenessPassRate = calculateRate(livenessPassed, livenessSessions)

  return {
    new_signups: newSignups,
    profile_completions: profileCompletions,
    profile_completion_rate: profileCompletionRate,
    guardian_invites: guardianInvites,
    liveness_sessions: livenessSessions,
    liveness_pass_rate: livenessPassRate,
    referrals_created: referralsCreated,
    boost_bids: boostBids,
  }
}

async function collectRetentionMetrics(db: Db, windowStart: Date, windowEnd: Date) {
  const dau = await countActiveUsers(db, windowStart, windowEnd)
  const [matchesCreated, messagesSent, reportsResolved, churnedUsers] = await Promise.all([
    countRange(db, 'matches', 'createdAt', windowStart, windowEnd),
    countRange(db, 'messages', 'createdAt', windowStart, windowEnd),
    countRange(db, 'reports', 'updatedAt', windowStart, windowEnd, { status: { $in: ['resolved', 'reviewed'] } }),
    countRange(db, 'users', 'updatedAt', windowStart, windowEnd, { status: { $in: ['suspended', 'deleted'] } }),
  ])

  const retainedUsers = await db.collection('users').countDocuments({
    status: 'active',
    createdAt: { $lt: windowStart },
    ...buildLastActiveFilter(windowStart, windowEnd),
  })

  const wauWindowStart = addDays(windowEnd, -7)
  const weeklyActiveUsers = await countActiveUsers(db, wauWindowStart, windowEnd)

  return {
    daily_active_users: dau,
    weekly_active_users: weeklyActiveUsers,
    retained_users: retainedUsers,
    matches_created: matchesCreated,
    messages_sent: messagesSent,
    reports_resolved: reportsResolved,
    churned_users: churnedUsers,
  }
}

async function collectRevenueMetrics(db: Db, windowStart: Date, windowEnd: Date) {
  const [successfulPayments, refundedPayments] = await Promise.all([
    countRange(db, 'payments', 'createdAt', windowStart, windowEnd, { status: 'succeeded' }),
    countRange(db, 'payments', 'createdAt', windowStart, windowEnd, { status: 'refunded' }),
  ])

  const [grossRevenue, refunds] = await Promise.all([
    sumRange(db, 'payments', 'amount.amountCents', windowStart, windowEnd, { status: 'succeeded' }),
    sumRange(db, 'payments', 'amount.amountCents', windowStart, windowEnd, { status: 'refunded' }),
  ])

  const netRevenue = Math.max(grossRevenue - refunds, 0)
  const avgOrderValue = successfulPayments > 0 ? Math.round(grossRevenue / successfulPayments) : 0

  const [newSubscriptions, activeSubscriptions, boostCreditsBurned] = await Promise.all([
    countRange(db, 'subscriptions', 'createdAt', windowStart, windowEnd, {
      status: { $in: ['trialing', 'active', 'past_due'] },
    }),
    db.collection('subscriptions').countDocuments({ status: { $in: ['active', 'trialing', 'past_due'] } }),
    sumRange(db, 'boost_sessions', 'bidAmountCredits', windowStart, windowEnd, {
      status: { $in: ['active', 'cleared'] },
    }),
  ])

  return {
    gross_revenue_cents: grossRevenue,
    refunds_cents: refunds,
    net_revenue_cents: netRevenue,
    avg_order_value_cents: avgOrderValue,
    successful_payments: successfulPayments,
    refunded_payments: refundedPayments,
    new_subscriptions: newSubscriptions,
    active_subscriptions: activeSubscriptions,
    boost_credits_burned: boostCreditsBurned,
  }
}

async function collectTrustMetrics(db: Db, windowStart: Date, windowEnd: Date) {
  const [reportsReceived, livenessManualReviews, trustEvents, guardianRequests, safetyFlags] = await Promise.all([
    countRange(db, 'reports', 'createdAt', windowStart, windowEnd),
    countRange(db, 'liveness_sessions', 'updatedAt', windowStart, windowEnd, { status: 'manual_review' }),
    countRange(db, 'trust_events', 'createdAt', windowStart, windowEnd),
    countRange(db, 'guardian_invite_requests', 'createdAt', windowStart, windowEnd),
    countRange(db, 'trust_events', 'createdAt', windowStart, windowEnd, { scoreDelta: { $lt: 0 } }),
  ])

  const reportsOpen = await db.collection('reports').countDocuments({ status: 'pending' })

  return {
    reports_received: reportsReceived,
    reports_open: reportsOpen,
    liveness_manual_reviews: livenessManualReviews,
    trust_events: trustEvents,
    guardian_requests: guardianRequests,
    safety_flags: safetyFlags,
  }
}

function resolveWindow(range: SnapshotRange, reference?: Date | string | number) {
  const refDate = reference ? coerceDate(reference) : new Date()
  const start = startOfDayUtc(refDate)

  if (range === 'weekly') {
    const day = start.getUTCDay()
    const diff = (day + 6) % 7 // align to Monday as start of week
    start.setUTCDate(start.getUTCDate() - diff)
  }

  if (range === 'monthly') {
    start.setUTCDate(1)
  }

  let end: Date
  switch (range) {
    case 'daily':
      end = addDays(start, 1)
      break
    case 'weekly':
      end = addDays(start, 7)
      break
    case 'monthly':
    default:
      end = addMonths(start, 1)
  }

  return { windowStart: start, windowEnd: end }
}

function coerceDate(input: Date | string | number) {
  const date = input instanceof Date ? new Date(input.getTime()) : new Date(input)
  if (Number.isNaN(date.getTime())) {
    throw new Error('Invalid date input provided to analytics snapshot service')
  }
  return date
}

function startOfDayUtc(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
}

function addDays(date: Date, days: number) {
  const copy = new Date(date)
  copy.setUTCDate(copy.getUTCDate() + days)
  return copy
}

function addMonths(date: Date, months: number) {
  const copy = new Date(date)
  copy.setUTCMonth(copy.getUTCMonth() + months)
  return copy
}

async function countRange(
  db: Db,
  collectionName: string,
  dateField: string,
  windowStart: Date,
  windowEnd: Date,
  extra: Record<string, unknown> = {},
) {
  const filter: Record<string, unknown> = { ...extra }
  filter[dateField] = { $gte: windowStart, $lt: windowEnd }
  return db.collection(collectionName).countDocuments(filter)
}

async function sumRange(
  db: Db,
  collectionName: string,
  fieldPath: string,
  windowStart: Date,
  windowEnd: Date,
  extra: Record<string, unknown> = {},
) {
  const match: Record<string, unknown> = { ...extra, createdAt: { $gte: windowStart, $lt: windowEnd } }

  const pipeline = [
    { $match: match },
    { $group: { _id: null, total: { $sum: `$${fieldPath}` } } },
  ]

  const [result] = await db.collection(collectionName).aggregate<{ total: number }>(pipeline).toArray()
  return result?.total ?? 0
}

async function countActiveUsers(db: Db, windowStart: Date, windowEnd: Date) {
  const filter = buildLastActiveFilter(windowStart, windowEnd)
  return db.collection('users').countDocuments(filter)
}

function buildLastActiveFilter(windowStart: Date, windowEnd: Date) {
  const isoStart = windowStart.toISOString()
  const isoEnd = windowEnd.toISOString()
  return {
    $or: [
      { lastActive: { $gte: isoStart, $lt: isoEnd } },
      { lastActiveAt: { $gte: windowStart, $lt: windowEnd } },
    ],
  }
}

function calculateRate(numerator: number, denominator: number) {
  if (!denominator || denominator === 0) {
    return 0
  }
  return Number((numerator / denominator).toFixed(4))
}
