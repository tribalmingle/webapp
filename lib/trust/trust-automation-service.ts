import type { Filter } from 'mongodb'
import { ObjectId } from 'mongodb'

import type {
  ActivityLogDocument,
  GuardianInviteRequestDocument,
  LivenessSessionDocument,
  TrustEventDocument,
} from '@/lib/data/types'
import { getMongoDb } from '@/lib/mongodb'

const LIVENESS_EVENT_TYPE = 'liveness_manual_check'
const LIVENESS_RESOLVED_STATUSES: Array<LivenessSessionDocument['status']> = ['passed', 'failed']
const DEFAULT_LIMIT = 10

export type TrustAutomationSnapshot = {
  livenessQueue: LivenessQueueSummary
  guardianInvites: GuardianInviteSummary
  trustSignals: TrustSignalSummary
  activityLogs: ActivityLogSummary
}

export type LivenessQueueSummary = {
  totalEvents: number
  pendingSessions: number
  items: TrustLivenessQueueItem[]
}

export type TrustLivenessQueueItem = {
  id: string
  userId: string
  sessionId?: string
  sessionToken?: string
  status?: LivenessSessionDocument['status']
  locale?: string
  intent?: LivenessSessionDocument['intent']
  providerDecision?: LivenessSessionDocument['provider']['decision']
  providerConfidence?: number
  reasons?: string[]
  source: TrustEventDocument['source']
  scoreDelta: number
  aggregateScore: number
  retryCount?: number
  createdAt: string
  updatedAt?: string
}

export type GuardianInviteSummary = {
  pendingCount: number
  queuedCount: number
  items: GuardianInviteItem[]
}

export type GuardianInviteItem = {
  id: string
  memberName: string
  contact: string
  locale: string
  status: GuardianInviteRequestDocument['status']
  regionHint?: string
  source: GuardianInviteRequestDocument['source']
  context?: string
  createdAt: string
}

export type TrustSignalSummary = {
  last24hCount: number
  items: TrustSignalItem[]
}

export type TrustSignalItem = {
  id: string
  userId: string
  eventType: TrustEventDocument['eventType']
  source: TrustEventDocument['source']
  scoreDelta: number
  aggregateScore: number
  createdAt: string
  context?: Record<string, unknown>
}

export type ActivityLogSummary = {
  items: ActivityLogItem[]
}

export type ActivityLogItem = {
  id: string
  action: string
  actorType: ActivityLogDocument['actorType']
  actorId?: string
  resource: {
    collection: string
    id?: string
  }
  metadata?: Record<string, unknown>
  createdAt: string
}

export async function getTrustAutomationSnapshot(options: { limit?: number } = {}) {
  const limit = options.limit ?? DEFAULT_LIMIT
  const db = await getMongoDb()

  const [livenessQueue, guardianInvites, trustSignals, activityLogs] = await Promise.all([
    buildLivenessQueue(db, limit),
    buildGuardianInviteSummary(db, limit),
    buildTrustSignals(db, limit),
    buildActivityLogSummary(db, Math.min(limit, 8)),
  ])

  return {
    livenessQueue,
    guardianInvites,
    trustSignals,
    activityLogs,
  }
}

async function buildLivenessQueue(db: Awaited<ReturnType<typeof getMongoDb>>, limit: number): Promise<LivenessQueueSummary> {
  const trustEventsCollection = db.collection<TrustEventDocument>('trust_events')
  const livenessCollection = db.collection<LivenessSessionDocument>('liveness_sessions')

  const events = await trustEventsCollection
    .find({ eventType: LIVENESS_EVENT_TYPE })
    .sort({ createdAt: -1 })
    .limit(limit * 3)
    .toArray()

  if (events.length === 0) {
    return {
      totalEvents: 0,
      pendingSessions: 0,
      items: [],
    }
  }

  const sessionIds: ObjectId[] = []
  const sessionTokens: string[] = []

  for (const event of events) {
    if (Array.isArray(event.relatedIds)) {
      for (const related of event.relatedIds) {
        if (related instanceof ObjectId) {
          sessionIds.push(related)
        }
      }
    }

    const token = typeof event.context?.sessionToken === 'string' ? event.context.sessionToken : undefined
    if (token) {
      sessionTokens.push(token)
    }
  }

  const sessionFilters: Filter<LivenessSessionDocument>[] = []
  if (sessionIds.length > 0) {
    sessionFilters.push({ _id: { $in: sessionIds } })
  }
  if (sessionTokens.length > 0) {
    sessionFilters.push({ sessionToken: { $in: sessionTokens } })
  }

  let sessions: LivenessSessionDocument[] = []
  if (sessionFilters.length === 1) {
    sessions = await livenessCollection.find(sessionFilters[0]).toArray()
  } else if (sessionFilters.length > 1) {
    sessions = await livenessCollection.find({ $or: sessionFilters }).toArray()
  }

  const sessionMap = new Map<string, LivenessSessionDocument>()
  for (const session of sessions) {
    if (session._id) {
      sessionMap.set(session._id.toHexString(), session)
    }
    if (session.sessionToken) {
      sessionMap.set(session.sessionToken, session)
    }
  }

  const items: TrustLivenessQueueItem[] = []
  for (const event of events) {
    const session = findSessionForEvent(event, sessionMap)
    if (session && LIVENESS_RESOLVED_STATUSES.includes(session.status)) {
      continue
    }

    items.push({
      id: objectIdToString(event._id),
      userId: objectIdToString(event.userId),
      sessionId: session?._id ? objectIdToString(session._id) : undefined,
      sessionToken: session?.sessionToken ?? (typeof event.context?.sessionToken === 'string' ? event.context.sessionToken : undefined),
      status: session?.status,
      locale: session?.locale ?? (typeof event.context?.locale === 'string' ? event.context.locale : undefined),
      intent: session?.intent ?? (typeof event.context?.intent === 'string' ? (event.context.intent as LivenessSessionDocument['intent']) : undefined),
      providerDecision: session?.provider?.decision,
      providerConfidence: session?.provider?.confidence,
      reasons: coerceStringArray(session?.provider?.reasons) ?? coerceStringArray(event.context?.reasons),
      source: event.source,
      scoreDelta: event.scoreDelta,
      aggregateScore: event.aggregateScore,
      retryCount: session?.retryCount,
      createdAt: event.createdAt?.toISOString() ?? new Date().toISOString(),
      updatedAt: session?.updatedAt?.toISOString(),
    })

    if (items.length >= limit) {
      break
    }
  }

  const totalEvents = await trustEventsCollection.countDocuments({ eventType: LIVENESS_EVENT_TYPE })
  const pendingSessions = await livenessCollection.countDocuments({ status: 'manual_review' })

  return {
    totalEvents,
    pendingSessions: pendingSessions || items.length,
    items,
  }
}

async function buildGuardianInviteSummary(db: Awaited<ReturnType<typeof getMongoDb>>, limit: number): Promise<GuardianInviteSummary> {
  const collection = db.collection<GuardianInviteRequestDocument>('guardian_invite_requests')
  const [pendingCount, queuedCount, items] = await Promise.all([
    collection.countDocuments({ status: 'received' }),
    collection.countDocuments({ status: 'queued' }),
    collection
      .find({ status: { $in: ['received', 'queued'] } })
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray(),
  ])

  return {
    pendingCount,
    queuedCount,
    items: items.map((item) => ({
      id: objectIdToString(item._id),
      memberName: item.memberName,
      contact: item.contact,
      locale: item.locale,
      status: item.status,
      regionHint: item.regionHint,
      source: item.source,
      context: item.context,
      createdAt: item.createdAt?.toISOString() ?? new Date().toISOString(),
    })),
  }
}

async function buildTrustSignals(db: Awaited<ReturnType<typeof getMongoDb>>, limit: number): Promise<TrustSignalSummary> {
  const collection = db.collection<TrustEventDocument>('trust_events')
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000)

  const [last24hCount, items] = await Promise.all([
    collection.countDocuments({ createdAt: { $gte: since } }),
    collection
      .find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray(),
  ])

  return {
    last24hCount,
    items: items.map((event) => ({
      id: objectIdToString(event._id),
      userId: objectIdToString(event.userId),
      eventType: event.eventType,
      source: event.source,
      scoreDelta: event.scoreDelta,
      aggregateScore: event.aggregateScore,
      context: sanitizeContext(event.context),
      createdAt: event.createdAt?.toISOString() ?? new Date().toISOString(),
    })),
  }
}

async function buildActivityLogSummary(db: Awaited<ReturnType<typeof getMongoDb>>, limit: number): Promise<ActivityLogSummary> {
  const collection = db.collection<ActivityLogDocument>('activity_logs')
  const logs = await collection.find().sort({ createdAt: -1 }).limit(limit).toArray()

  return {
    items: logs.map((log) => ({
      id: objectIdToString(log._id),
      action: log.action,
      actorType: log.actorType,
      actorId: log.actorId ? objectIdToString(log.actorId) : undefined,
      resource: {
        collection: log.resource.collection,
        id: log.resource.id ? objectIdToString(log.resource.id) : undefined,
      },
      metadata: sanitizeContext(log.metadata),
      createdAt: log.createdAt?.toISOString() ?? new Date().toISOString(),
    })),
  }
}

function findSessionForEvent(
  event: TrustEventDocument,
  sessionMap: Map<string, LivenessSessionDocument>,
): LivenessSessionDocument | undefined {
  if (Array.isArray(event.relatedIds)) {
    for (const related of event.relatedIds) {
      const key = related instanceof ObjectId ? related.toHexString() : undefined
      if (key && sessionMap.has(key)) {
        return sessionMap.get(key)
      }
    }
  }

  const token = typeof event.context?.sessionToken === 'string' ? event.context.sessionToken : undefined
  if (token && sessionMap.has(token)) {
    return sessionMap.get(token)
  }

  return undefined
}

function coerceStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return undefined
  }
  const result = value
    .map((entry) => (typeof entry === 'string' ? entry : null))
    .filter((entry): entry is string => Boolean(entry))
  return result.length > 0 ? result : undefined
}

function sanitizeContext(value: unknown) {
  if (!value || typeof value !== 'object') {
    return undefined
  }
  try {
    const normalized = JSON.parse(JSON.stringify(value)) as Record<string, unknown>
    if (normalized && Object.keys(normalized).length === 0) {
      return undefined
    }
    return normalized
  } catch (error) {
    return undefined
  }
}

function objectIdToString(value: ObjectId | string | undefined | null) {
  if (!value) {
    return ''
  }
  if (value instanceof ObjectId) {
    return value.toHexString()
  }
  return value
}
