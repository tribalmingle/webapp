import crypto from 'node:crypto'
import { ObjectId, type UpdateFilter } from 'mongodb'

import type { LivenessSessionDocument } from '@/lib/data/types'
import { getMongoDb } from '@/lib/mongodb'

const COLLECTION_NAME = 'liveness_sessions'
const SESSION_TTL_MINUTES = Number(process.env.LIVENESS_SESSION_TTL_MINUTES ?? 15)

const REQUIRE_DOCUMENT_FLAG = process.env.LIVENESS_REQUIRE_DOCUMENT === 'true'

type CreateLivenessSessionInput = {
  memberId: string | ObjectId
  intent: LivenessSessionDocument['intent']
  device: LivenessSessionDocument['device']
  locale: string
  requireDocumentScan?: boolean
}

type UploadUrls = NonNullable<LivenessSessionDocument['uploadUrls']>

type CompleteUploadInput = {
  sessionToken: string
  memberId: string | ObjectId
  artifacts: NonNullable<LivenessSessionDocument['artifacts']>
  metrics?: LivenessSessionDocument['metrics']
  incrementRetry?: boolean
}

type ProviderDecisionInput = {
  sessionToken: string
  provider: string
  providerSessionId?: string
  decision: Exclude<LivenessSessionDocument['provider']['decision'], 'pending'>
  confidence?: number
  reasons?: string[]
}

export type ManualReviewResolution = 'approve' | 'reject' | 'request_reshoot'

type ResolveManualReviewInput = {
  sessionToken: string
  reviewerId: string | ObjectId
  resolution: ManualReviewResolution
  note?: string
}

export async function createLivenessSession(input: CreateLivenessSessionInput) {
  const db = await getMongoDb()
  const now = new Date()
  const expiresAt = new Date(now.getTime() + SESSION_TTL_MINUTES * 60 * 1000)
  const sessionToken = generateSessionToken()

  const uploadUrls = generateUploadUrls(sessionToken, {
    includeDocumentScan: input.requireDocumentScan ?? REQUIRE_DOCUMENT_FLAG,
  })

  const document: LivenessSessionDocument = {
    _id: new ObjectId(),
    sessionToken,
    memberId: toObjectId(input.memberId),
    intent: input.intent,
    device: input.device,
    locale: input.locale,
    status: 'awaiting_upload',
    expiresAt,
    uploadUrls,
    artifacts: undefined,
    metrics: undefined,
    provider: {
      provider: 'pending',
      decision: 'pending',
      confidence: undefined,
      decidedAt: undefined,
      providerSessionId: undefined,
      reasons: undefined,
    },
    retryCount: 0,
    webhookAttempts: 0,
    flags: [],
    notes: [],
    createdAt: now,
    updatedAt: now,
  }

  await db.collection<LivenessSessionDocument>(COLLECTION_NAME).insertOne(document)
  return document
}

export async function getLivenessSessionByToken(sessionToken: string) {
  const db = await getMongoDb()
  return db.collection<LivenessSessionDocument>(COLLECTION_NAME).findOne({ sessionToken })
}

export async function markSessionAwaitingProvider(input: CompleteUploadInput) {
  const db = await getMongoDb()
  const update = {
    $set: {
      artifacts: input.artifacts,
      metrics: input.metrics,
      status: 'awaiting_provider' as LivenessSessionDocument['status'],
      updatedAt: new Date(),
    },
    ...(input.incrementRetry ? { $inc: { retryCount: 1 } } : {}),
  }

  const result = (await db
    .collection<LivenessSessionDocument>(COLLECTION_NAME)
    .findOneAndUpdate({ sessionToken: input.sessionToken, memberId: toObjectId(input.memberId) }, update, { returnDocument: 'after' })) as LivenessSessionDocument | null

  return result
}

export async function applyProviderDecision(input: ProviderDecisionInput) {
  const db = await getMongoDb()
  const finalStatus: LivenessSessionDocument['status'] =
    input.decision === 'pass' ? 'passed' : input.decision === 'fail' ? 'failed' : 'manual_review'

  const provider = {
    provider: input.provider,
    providerSessionId: input.providerSessionId,
    decision: input.decision,
    confidence: input.confidence,
    reasons: input.reasons,
    decidedAt: new Date(),
  }

  const result = (await db
    .collection<LivenessSessionDocument>(COLLECTION_NAME)
    .findOneAndUpdate(
      { sessionToken: input.sessionToken },
      {
        $set: {
          provider,
          status: finalStatus,
          updatedAt: new Date(),
        },
      },
      { returnDocument: 'after' },
    )) as LivenessSessionDocument | null

  return result
}

export async function incrementWebhookAttempt(sessionToken: string) {
  const db = await getMongoDb()
  const result = (await db
    .collection<LivenessSessionDocument>(COLLECTION_NAME)
    .findOneAndUpdate(
      { sessionToken },
      {
        $inc: { webhookAttempts: 1 },
        $set: { updatedAt: new Date() },
      },
      { returnDocument: 'after' },
    )) as LivenessSessionDocument | null

  return result
}

export async function appendLivenessFlag(sessionToken: string, flag: string) {
  const db = await getMongoDb()
  const result = (await db
    .collection<LivenessSessionDocument>(COLLECTION_NAME)
    .findOneAndUpdate(
      { sessionToken },
      {
        $addToSet: { flags: flag },
        $set: { updatedAt: new Date() },
      },
      { returnDocument: 'after' },
    )) as LivenessSessionDocument | null

  return result
}

export async function appendLivenessNote(sessionToken: string, message: string, authorId?: string | ObjectId) {
  const db = await getMongoDb()
  const note = {
    message,
    authorId: authorId ? toObjectId(authorId) : undefined,
    createdAt: new Date(),
  }

  const result = (await db
    .collection<LivenessSessionDocument>(COLLECTION_NAME)
    .findOneAndUpdate(
      { sessionToken },
      {
        $push: { notes: note },
        $set: { updatedAt: new Date() },
      },
      { returnDocument: 'after' },
    )) as LivenessSessionDocument | null

  return result
}

const resolutionStatusMap: Record<ManualReviewResolution, LivenessSessionDocument['status']> = {
  approve: 'passed',
  reject: 'failed',
  request_reshoot: 'awaiting_upload',
}

const resolutionProviderDecisionMap: Record<ManualReviewResolution, ProviderDecisionInput['decision']> = {
  approve: 'pass',
  reject: 'fail',
  request_reshoot: 'fallback',
}

export async function resolveManualReview(input: ResolveManualReviewInput) {
  const db = await getMongoDb()
  const now = new Date()
  const providerDecision = {
    provider: 'manual_review',
    providerSessionId: undefined,
    decision: resolutionProviderDecisionMap[input.resolution],
    confidence: input.resolution === 'request_reshoot' ? undefined : 1,
    reasons: input.resolution === 'request_reshoot' ? ['reshoot_requested'] : undefined,
    decidedAt: now,
  }

  const update: UpdateFilter<LivenessSessionDocument> = {
    $set: {
      status: resolutionStatusMap[input.resolution],
      provider: providerDecision,
      updatedAt: now,
    },
  }

  if (input.resolution === 'request_reshoot') {
    update.$inc = { retryCount: 1 }
  }

  if (input.note) {
    update.$push = {
      notes: {
        message: input.note,
        authorId: toObjectId(input.reviewerId),
        createdAt: now,
      },
    }
  }

  const result = (await db
    .collection<LivenessSessionDocument>(COLLECTION_NAME)
    .findOneAndUpdate({ sessionToken: input.sessionToken }, update, { returnDocument: 'after' })) as LivenessSessionDocument | null

  return result
}

function generateSessionToken(length = 32) {
  return crypto.randomBytes(length).toString('base64url').slice(0, length)
}

function generateUploadUrls(sessionToken: string, options: { includeDocumentScan: boolean }): UploadUrls {
  const baseUrl = process.env.LIVENESS_UPLOAD_BASE_URL || 'https://uploads.tribalmingle.test/liveness'
  const urls: UploadUrls = {
    photo: `${baseUrl}/${sessionToken}/photo`,
    video: `${baseUrl}/${sessionToken}/video`,
  }

  if (options.includeDocumentScan) {
    urls.idFront = `${baseUrl}/${sessionToken}/id-front`
    urls.idBack = `${baseUrl}/${sessionToken}/id-back`
  }

  return urls
}

function toObjectId(value: string | ObjectId) {
  if (value instanceof ObjectId) {
    return value
  }
  return new ObjectId(value)
}
