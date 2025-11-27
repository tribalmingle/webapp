/**
 * Match Expiry Worker
 * Expires old unengaged matches to keep discovery fresh
 */

import { Queue, Worker } from 'bullmq'
import { getMongoDb } from '@/lib/mongodb'
import { CollectionNames } from '@/lib/data/collection-names'
import { ObjectId } from 'mongodb'

const REDIS_HOST = process.env.REDIS_HOST || 'localhost'
const REDIS_PORT = parseInt(process.env.REDIS_PORT || '6379', 10)

const connection = {
  host: REDIS_HOST,
  port: REDIS_PORT,
}

// Matches expire after 30 days without engagement
const MATCH_EXPIRY_DAYS = 30

export interface MatchExpiryJob {
  userId?: string // Optional: expire for specific user
  batchSize?: number
}

/**
 * Queue for match expiry jobs
 */
export const matchExpiryQueue = new Queue<MatchExpiryJob>('match-expiry', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: {
      age: 86400, // Keep completed jobs for 1 day
      count: 1000,
    },
    removeOnFail: {
      age: 604800, // Keep failed jobs for 7 days
    },
  },
})

/**
 * Process match expiry job
 */
export async function processMatchExpiry(job: MatchExpiryJob): Promise<{
  expired: number
  archived: number
}> {
  const db = await getMongoDb()
  const batchSize = job.batchSize || 500
  const expiryDate = new Date()
  expiryDate.setDate(expiryDate.getDate() - MATCH_EXPIRY_DAYS)

  console.log('[match-expiry] Starting match expiry check', {
    userId: job.userId,
    expiryDate,
    batchSize,
  })

  // Build query to find expired matches
  const query: any = {
    created_at: { $lt: expiryDate },
    expired_at: null, // Not already expired
    $or: [
      { last_interaction_at: null }, // Never interacted
      { last_interaction_at: { $lt: expiryDate } }, // No recent interaction
    ],
  }

  // If userId provided, only expire matches for that user
  if (job.userId) {
    const userObjectId = new ObjectId(job.userId)
    query.$or = [
      { user_id: userObjectId },
      { matched_user_id: userObjectId },
    ]
  }

  // Find matches to expire
  const matchesToExpire = await db
    .collection(CollectionNames.USER_MATCHES)
    .find(query)
    .limit(batchSize)
    .toArray()

  if (matchesToExpire.length === 0) {
    console.log('[match-expiry] No matches to expire')
    return { expired: 0, archived: 0 }
  }

  console.log('[match-expiry] Found matches to expire', {
    count: matchesToExpire.length,
  })

  const now = new Date()
  const matchIds = matchesToExpire.map((m: any) => m._id)

  // Mark matches as expired
  const expireResult = await db
    .collection(CollectionNames.USER_MATCHES)
    .updateMany(
      { _id: { $in: matchIds } },
      {
        $set: {
          expired_at: now,
          updated_at: now,
        },
      }
    )

  // Archive expired matches (move to separate collection for analytics)
  const archivedMatches = matchesToExpire.map((match: any) => ({
    ...match,
    expired_at: now,
    archived_at: now,
  }))

  let archived = 0
  if (archivedMatches.length > 0) {
    const archiveResult = await db
      .collection('archived_matches')
      .insertMany(archivedMatches)
    archived = archiveResult.insertedCount
  }

  console.log('[match-expiry] Matches expired', {
    expired: expireResult.modifiedCount,
    archived,
  })

  return {
    expired: expireResult.modifiedCount,
    archived,
  }
}

/**
 * Queue a match expiry job
 */
export async function queueMatchExpiry(params: MatchExpiryJob = {}) {
  await matchExpiryQueue.add('expire-matches', params)
  console.log('[match-expiry] Job queued', params)
}

/**
 * Queue match expiry for specific user
 */
export async function queueUserMatchExpiry(userId: string) {
  await queueMatchExpiry({ userId })
}

/**
 * Schedule daily match expiry job (runs at 2 AM daily)
 */
export async function scheduleDailyMatchExpiry() {
  await matchExpiryQueue.add(
    'daily-match-expiry',
    { batchSize: 1000 },
    {
      repeat: {
        pattern: '0 2 * * *', // 2 AM every day
      },
      jobId: 'daily-match-expiry',
    }
  )
  console.log('[match-expiry] Daily job scheduled')
}

/**
 * Worker to process match expiry jobs
 */
export const matchExpiryWorker = new Worker<MatchExpiryJob>(
  'match-expiry',
  async (job) => {
    const result = await processMatchExpiry(job.data)
    return result
  },
  {
    connection,
    concurrency: 2, // Process 2 expiry jobs concurrently
    limiter: {
      max: 10,
      duration: 60000, // Max 10 jobs per minute
    },
  }
)

matchExpiryWorker.on('completed', (job) => {
  console.log(`[match-expiry] Job ${job.id} completed`, job.returnvalue)
})

matchExpiryWorker.on('failed', (job, err) => {
  console.error(`[match-expiry] Job ${job?.id} failed`, err)
})
