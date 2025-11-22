import { randomInt, randomUUID, createHash } from 'node:crypto'
import { ObjectId } from 'mongodb'

import { getCollection } from '@/lib/db/mongodb'

type MediaType = 'id' | 'selfie' | 'voice' | 'video'

type ModerationJob = {
  _id: ObjectId
  prospectId: ObjectId
  prospectIdHex: string
  uploadKey: string
  mediaType: MediaType
  fileUrl: string
  partner: string
  status: 'pending' | 'processing' | 'retry' | 'completed' | 'failed'
  attempts: number
  aiScore: number
}

type ModerationResult = {
  score: number
  passed: boolean
  flags: string[]
  insights: string[]
}

const POLL_INTERVAL_MS = Number(process.env.MODERATION_WORKER_POLL_MS ?? 5000)
const MAX_ATTEMPTS = Number(process.env.MODERATION_WORKER_MAX_ATTEMPTS ?? 5)
const JOB_BATCH = Number(process.env.MODERATION_WORKER_BATCH ?? 5)

async function claimJob() {
  const collection = await getCollection<ModerationJob>('moderation_jobs')
  const now = new Date()

  const job = await collection.findOneAndUpdate(
    {
      status: { $in: ['pending', 'retry'] },
      attempts: { $lt: MAX_ATTEMPTS },
    },
    {
      $set: {
        status: 'processing',
        updatedAt: now,
        processingStartedAt: now,
      },
      $inc: { attempts: 1 },
    },
    {
      sort: { updatedAt: 1, createdAt: 1 },
      returnDocument: 'after',
    },
  )

  return job.value ?? null
}

async function processJob(job: ModerationJob) {
  const jobs = await getCollection('moderation_jobs')
  const applicants = await getCollection('onboarding_applicants')
  const now = new Date()

  try {
    const result = await runMockPartner(job)

    await jobs.updateOne(
      { _id: job._id },
      {
        $set: {
          status: 'completed',
          updatedAt: now,
          completedAt: now,
          partnerScore: result.score,
          flags: result.flags,
          insights: result.insights,
          correlationId: randomUUID(),
        },
      },
    )

    await applicants.updateOne(
      { _id: job.prospectId, 'mediaUploads.uploadKey': job.uploadKey },
      {
        $set: {
          'mediaUploads.$.moderation.status': result.passed ? 'approved' : 'flagged',
          'mediaUploads.$.moderation.completedAt': now,
          'mediaUploads.$.moderation.partnerScore': result.score,
          'mediaUploads.$.moderation.flags': result.flags,
          'mediaUploads.$.moderation.insights': result.insights,
          'mediaUploads.$.moderation.correlationId': randomUUID(),
          ...(result.passed
            ? {}
            : {
                'mediaUploads.$.status': 'flagged',
                'mediaUploads.$.message': 'Stewards reviewing your media — retake if requested.',
              }),
        },
      },
    )

    console.info('[moderation-worker] Completed job', job._id.toHexString(), {
      partner: job.partner,
      score: result.score,
      passed: result.passed,
    })
  } catch (error) {
    console.error('[moderation-worker] Job failed', job._id.toHexString(), error)
    await jobs.updateOne(
      { _id: job._id },
      {
        $set: {
          status: job.attempts >= MAX_ATTEMPTS ? 'failed' : 'retry',
          updatedAt: now,
          error: error instanceof Error ? error.message : 'Unknown moderation error',
        },
      },
    )

    await applicants.updateOne(
      { _id: job.prospectId, 'mediaUploads.uploadKey': job.uploadKey },
      {
        $set: {
          'mediaUploads.$.moderation.status': 'error',
          'mediaUploads.$.moderation.error': 'Partner moderation failed, please retry shortly.',
          'mediaUploads.$.moderation.updatedAt': now,
        },
      },
    )
  }
}

async function workerLoop() {
  while (true) {
    let processed = 0
    while (processed < JOB_BATCH) {
      const job = await claimJob()
      if (!job) break
      await processJob(job)
      processed += 1
    }

    if (processed === 0) {
      await delay(POLL_INTERVAL_MS)
    }
  }
}

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function runMockPartner(job: ModerationJob): Promise<ModerationResult> {
  // Deterministic hash to keep scores stable per upload.
  const hash = createHash('sha256').update(job.uploadKey).digest('hex')
  const baseScore = (parseInt(hash.slice(0, 8), 16) % 100) / 100
  const noise = (randomInt(0, 5) / 100)
  const score = Math.min(1, Math.max(0, baseScore + noise))

  const thresholds: Record<MediaType, number> = {
    id: 0.7,
    selfie: 0.65,
    voice: 0.6,
    video: 0.6,
  }
  const minScore = thresholds[job.mediaType]
  const passed = score >= minScore

  const flags: string[] = []
  const insights: string[] = []

  if (!passed) {
    flags.push('confidence_low')
    insights.push('AI detected low liveness confidence — manual review required.')
  } else {
    insights.push('AI cleared media — steward will spot check asynchronously.')
  }

  return { score, passed, flags, insights }
}

workerLoop().catch(error => {
  console.error('[moderation-worker] Fatal error', error)
  process.exit(1)
})
