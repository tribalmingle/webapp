import { ObjectId } from 'mongodb'

import { getCollection } from '@/lib/db/mongodb'
import { createSignedUpload } from '@/lib/storage/s3'

const COLLECTION = 'onboarding_applicants'
const MODERATION_JOBS_COLLECTION = 'moderation_jobs'
type ModerationPartner = 'rekognition' | 'hive' | 'manual'
const DEFAULT_MODERATION_PARTNER: ModerationPartner = (process.env.MEDIA_MODERATION_PARTNER as ModerationPartner) || 'rekognition'

type MediaType = 'id' | 'selfie' | 'voice' | 'video'

type CompatibilityPayload = {
  prospectId?: string
  email: string
  personas: Array<{ id: string; score: number }>
  values: Array<{ promptId: string; value: number; note?: string }>
  stage: string
}

type MediaUploadRequest = {
  prospectId?: string
  email: string
  mediaType: MediaType
  contentType: string
}

type MediaFinalizeRequest = {
  prospectId: string
  uploadKey: string
  mediaType: MediaType
  aiHints?: Record<string, unknown>
}

type ModerationJobPayload = {
  prospectObjectId: ObjectId
  prospectId: string
  uploadKey: string
  mediaType: MediaType
  fileUrl: string
  aiScore: number
  partner?: ModerationPartner
}

type MediaUploadEntry = {
  type: MediaType
  uploadKey: string
  fileUrl: string
  status: string
  requestedAt: Date
  aiScore?: number
  scoredAt?: Date
  moderation?: {
    jobId: string
    status: string
    partner: ModerationPartner
    queuedAt: Date
  }
}

type OnboardingApplicantDocument = {
  _id: ObjectId
  email?: string
  compatibilityDraft?: {
    personas: Array<{ id: string; score: number }>
    values: Array<{ promptId: string; value: number; note?: string }>
    stage: string
    savedAt: Date
  }
  planSelection?: {
    planId: string
    priceCents: number
    interval: 'trial' | 'monthly' | 'quarterly' | 'annual'
    selectedAt: Date
  }
  mediaUploads?: MediaUploadEntry[]
  lastStep?: string
  status?: string
  createdAt?: Date
  updatedAt?: Date
}

type PlanSelectionRequest = {
  prospectId: string
  planId: string
  priceCents: number
  interval: 'trial' | 'monthly' | 'quarterly' | 'annual'
}

async function resolveApplicantId(prospectId?: string) {
  return prospectId ? new ObjectId(prospectId) : new ObjectId()
}

export async function upsertCompatibilityDraft(payload: CompatibilityPayload) {
  const collection = await getCollection<OnboardingApplicantDocument>(COLLECTION)
  const _id = await resolveApplicantId(payload.prospectId)
  const now = new Date()

  await collection.updateOne(
    { _id },
    {
      $set: {
        email: payload.email,
        compatibilityDraft: {
          personas: payload.personas,
          values: payload.values,
          stage: payload.stage,
          savedAt: now,
        },
        lastStep: 'compatibility',
        updatedAt: now,
      },
      $setOnInsert: {
        createdAt: now,
        status: 'initiated',
      },
    },
    { upsert: true },
  )

  return { prospectId: _id.toHexString() }
}

export async function requestMediaUpload(payload: MediaUploadRequest) {
  const collection = await getCollection<OnboardingApplicantDocument>(COLLECTION)
  const _id = await resolveApplicantId(payload.prospectId)
  const signed = await createSignedUpload(payload.contentType, `onboarding/${payload.mediaType}`)
  const now = new Date()

  await collection.updateOne(
    { _id },
    {
      $set: {
        email: payload.email,
        updatedAt: now,
      },
      $setOnInsert: {
        createdAt: now,
        status: 'initiated',
      },
      $push: {
        mediaUploads: {
          type: payload.mediaType,
          uploadKey: signed.key,
          fileUrl: signed.fileUrl,
          status: 'requested',
          requestedAt: now,
        },
      },
    },
    { upsert: true },
  )

  return { ...signed, prospectId: _id.toHexString() }
}

export async function finalizeMediaUpload(payload: MediaFinalizeRequest) {
  const collection = await getCollection<OnboardingApplicantDocument>(COLLECTION)
  const _id = new ObjectId(payload.prospectId)
  const now = new Date()
  const aiScore = calculateMediaScore(payload)
  const uploadDoc = await collection.findOne(
    { _id, 'mediaUploads.uploadKey': payload.uploadKey },
    { projection: { mediaUploads: { $elemMatch: { uploadKey: payload.uploadKey } } } },
  )

  const mediaUploadEntry = uploadDoc?.mediaUploads?.[0]
  if (!mediaUploadEntry) {
    throw new Error('Upload not found for finalizeMediaUpload')
  }

  const partner = DEFAULT_MODERATION_PARTNER
  const moderationJobId = await enqueueModerationJob({
    prospectObjectId: _id,
    prospectId: payload.prospectId,
    uploadKey: payload.uploadKey,
    mediaType: payload.mediaType,
    fileUrl: mediaUploadEntry.fileUrl,
    aiScore,
    partner,
  })

  await collection.updateOne(
    { _id, 'mediaUploads.uploadKey': payload.uploadKey },
    {
      $set: {
        'mediaUploads.$.status': aiScore >= 0.6 ? 'approved' : 'flagged',
        'mediaUploads.$.aiScore': aiScore,
        'mediaUploads.$.scoredAt': now,
        'mediaUploads.$.moderation': {
          jobId: moderationJobId.toHexString(),
          status: 'pending',
          partner,
          queuedAt: now,
        },
        updatedAt: now,
        lastStep: 'media',
      },
    },
  )

  return { prospectId: payload.prospectId, aiScore }
}

export async function savePlanSelection(payload: PlanSelectionRequest) {
  const collection = await getCollection<OnboardingApplicantDocument>(COLLECTION)
  const _id = new ObjectId(payload.prospectId)
  const now = new Date()

  await collection.updateOne(
    { _id },
    {
      $set: {
        planSelection: {
          planId: payload.planId,
          priceCents: payload.priceCents,
          interval: payload.interval,
          selectedAt: now,
        },
        lastStep: 'plan',
        updatedAt: now,
      },
    },
  )

  return { prospectId: payload.prospectId, planId: payload.planId }
}

function calculateMediaScore(payload: MediaFinalizeRequest) {
  if (payload.aiHints && typeof payload.aiHints.quality === 'number') {
    return Math.min(1, Math.max(0, Number(payload.aiHints.quality)))
  }
  return payload.mediaType === 'selfie' ? 0.8 : 0.7
}

async function enqueueModerationJob(payload: ModerationJobPayload) {
  const collection = await getCollection(MODERATION_JOBS_COLLECTION)
  const now = new Date()
  const partner = payload.partner ?? DEFAULT_MODERATION_PARTNER
  const result = await collection.insertOne({
    prospectId: payload.prospectObjectId,
    prospectIdHex: payload.prospectId,
    uploadKey: payload.uploadKey,
    mediaType: payload.mediaType,
    fileUrl: payload.fileUrl,
    aiScore: payload.aiScore,
    partner,
    status: 'pending',
    attempts: 0,
    createdAt: now,
    updatedAt: now,
    insights: [],
  })

  return result.insertedId
}
