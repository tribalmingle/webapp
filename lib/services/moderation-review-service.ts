import { ObjectId } from 'mongodb'

import { getCollection } from '@/lib/db/mongodb'

type MediaType = 'id' | 'selfie' | 'voice' | 'video'

export type ModerationJobStatus = 'pending' | 'processing' | 'retry' | 'completed' | 'failed'

type ListOptions = {
  limit?: number
  statuses?: ModerationJobStatus[]
}

type Resolution = 'approve' | 'reject' | 'request_reshoot'

type ApplicantMediaUpload = {
  type: MediaType
  uploadKey: string
  fileUrl?: string
  status?: string
  message?: string
  moderation?: Record<string, unknown>
}

type ModerationJobDocument = {
  _id: ObjectId
  prospectId: ObjectId
  prospectIdHex?: string
  uploadKey: string
  mediaType: MediaType
  fileUrl: string
  aiScore?: number
  partner?: string
  status: ModerationJobStatus
  attempts: number
  createdAt: Date
  updatedAt: Date
  applicant?: {
    _id: ObjectId
    email?: string
    name?: string
    mediaUploads?: ApplicantMediaUpload[]
  }
  mediaUpload?: ApplicantMediaUpload
}

export type ModerationQueueItem = {
  id: string
  prospectId: string
  email?: string
  mediaType: MediaType
  fileUrl: string
  aiScore?: number
  partner?: string
  status: ModerationJobStatus
  attempts: number
  createdAt: string
  uploadKey: string
  mediaStatus?: string
  mediaMessage?: string
}

const JOB_LIMIT_MIN = 1
const JOB_LIMIT_MAX = 50

export async function listModerationJobs(options: ListOptions = {}): Promise<ModerationQueueItem[]> {
  const limit = normalizeLimit(options.limit)
  const statuses = options.statuses && options.statuses.length > 0
    ? options.statuses
    : ['pending', 'retry', 'processing']

  const collection = await getCollection<ModerationJobDocument>('moderation_jobs')

  const cursor = collection.aggregate<ModerationJobDocument>([
    { $match: { status: { $in: statuses } } },
    { $sort: { createdAt: -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: 'onboarding_applicants',
        localField: 'prospectId',
        foreignField: '_id',
        as: 'applicant',
      },
    },
    { $unwind: { path: '$applicant', preserveNullAndEmptyArrays: true } },
    {
      $addFields: {
        mediaUpload: {
          $first: {
            $filter: {
              input: { $ifNull: ['$applicant.mediaUploads', []] },
              as: 'upload',
              cond: { $eq: ['$$upload.uploadKey', '$uploadKey'] },
            },
          },
        },
      },
    },
  ])

  const items: ModerationQueueItem[] = []
  for await (const job of cursor) {
    items.push({
      id: job._id.toHexString(),
      prospectId: job.prospectIdHex ?? job.prospectId.toHexString(),
      email: job.applicant?.email,
      mediaType: job.mediaType,
      fileUrl: job.fileUrl,
      aiScore: job.aiScore,
      partner: job.partner,
      status: job.status,
      attempts: job.attempts,
      createdAt: job.createdAt?.toISOString?.() ?? new Date().toISOString(),
      uploadKey: job.uploadKey,
      mediaStatus: job.mediaUpload?.status,
      mediaMessage: job.mediaUpload?.message,
    })
  }

  return items
}

type ResolveInput = {
  jobId: string
  reviewerEmail: string
  resolution: Resolution
  note?: string
}

export async function resolveModerationJob(input: ResolveInput) {
  const jobs = await getCollection('moderation_jobs')
  const applicants = await getCollection('onboarding_applicants')
  const _id = new ObjectId(input.jobId)
  const job = await jobs.findOne({ _id })

  if (!job) {
    throw new Error('Moderation job not found')
  }

  const now = new Date()
  const moderationStatus = mapResolutionToStatus(input.resolution)
  const applicantStatus = mapResolutionToApplicantStatus(input.resolution)
  const applicantMessage = buildApplicantMessage(input.resolution, input.note)

  const jobUpdate = await jobs.updateOne(
    { _id },
    {
      $set: {
        status: 'completed',
        resolution: input.resolution,
        resolvedAt: now,
        resolvedBy: input.reviewerEmail,
        reviewerNote: input.note,
        updatedAt: now,
      },
    },
  )

  if (jobUpdate.matchedCount === 0) {
    throw new Error('Failed to update moderation job')
  }

  await applicants.updateOne(
    { _id: job.prospectId, 'mediaUploads.uploadKey': job.uploadKey },
    {
      $set: {
        'mediaUploads.$.status': applicantStatus,
        'mediaUploads.$.message': applicantMessage,
        'mediaUploads.$.moderation.status': moderationStatus,
        'mediaUploads.$.moderation.reviewedAt': now,
        'mediaUploads.$.moderation.reviewedBy': input.reviewerEmail,
        'mediaUploads.$.moderation.note': input.note,
      },
    },
  )

  return { success: true }
}

function mapResolutionToStatus(resolution: Resolution) {
  switch (resolution) {
    case 'approve':
      return 'approved'
    case 'reject':
      return 'rejected'
    case 'request_reshoot':
      return 'needs_reshoot'
    default:
      return 'pending'
  }
}

function mapResolutionToApplicantStatus(resolution: Resolution) {
  if (resolution === 'approve') {
    return 'approved'
  }
  return 'flagged'
}

function buildApplicantMessage(resolution: Resolution, note?: string) {
  const base = note?.trim()
  if (base) {
    return base
  }

  switch (resolution) {
    case 'approve':
      return 'Verified by steward.'
    case 'reject':
      return 'Upload did not match your ID. Contact concierge for support.'
    case 'request_reshoot':
      return 'Need clearer media (lighting and framing). Please resubmit.'
    default:
      return undefined
  }
}

function normalizeLimit(value?: number) {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return 20
  }
  return Math.min(JOB_LIMIT_MAX, Math.max(JOB_LIMIT_MIN, Math.trunc(value)))
}
``