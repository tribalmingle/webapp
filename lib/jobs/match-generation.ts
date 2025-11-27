/**
 * Match Generation Background Jobs
 * Runs daily batch processing to refresh user matches
 */

import { Worker, Job } from 'bullmq'
import { getQueue, redisConnection, QueueNames } from './queue-setup'
import { getDb } from '@/lib/db/mongodb'
import { CollectionNames } from '@/lib/data/collection-names'
import { ObjectId } from 'mongodb'

// Job data types
export interface MatchGenerationJobData {
  userId: string
  priority?: 'high' | 'normal' | 'low'
  batchSize?: number
}

export interface BatchMatchGenerationJobData {
  userIds?: string[]
  startAfter?: string
  limit?: number
}

/**
 * Generate matches for a single user
 */
async function generateMatchesForUser(userId: string, batchSize = 50) {
  const db = await getDb()
  const userObjectId = new ObjectId(userId)

  // Get user profile and preferences
  const user = await db
    .collection(CollectionNames.USERS)
    .findOne({ _id: userObjectId })

  if (!user) {
    throw new Error(`User not found: ${userId}`)
  }

  const preference = await db
    .collection(CollectionNames.USER_PREFERENCES)
    .findOne({ user_id: userObjectId })

  if (!preference) {
    console.log(`[match-gen] No preferences found for user ${userId}`)
    return { matchCount: 0 }
  }

  // Build match query based on preferences
  const matchQuery: any = {
    _id: { $ne: userObjectId },
    deleted_at: { $exists: false },
  }

  // Gender preference
  if (preference.gender_preference && preference.gender_preference !== 'all') {
    matchQuery.gender = preference.gender_preference
  }

  // Age range
  if (preference.age_min || preference.age_max) {
    matchQuery.birth_date = {}
    if (preference.age_min) {
      const maxDate = new Date()
      maxDate.setFullYear(maxDate.getFullYear() - preference.age_min)
      matchQuery.birth_date.$lte = maxDate
    }
    if (preference.age_max) {
      const minDate = new Date()
      minDate.setFullYear(minDate.getFullYear() - preference.age_max)
      matchQuery.birth_date.$gte = minDate
    }
  }

  // Distance preference (requires geospatial query)
  if (preference.max_distance && user.location?.coordinates) {
    matchQuery.location = {
      $near: {
        $geometry: user.location,
        $maxDistance: preference.max_distance * 1609.34, // miles to meters
      },
    }
  }

  // Tribe preference
  if (preference.tribe_ids?.length) {
    matchQuery.tribe_id = { $in: preference.tribe_ids.map((id: any) => new ObjectId(id)) }
  }

  // Exclude users already matched/blocked
  const excludeIds = await db
    .collection(CollectionNames.USER_MATCHES)
    .find({
      $or: [{ user_id: userObjectId }, { matched_user_id: userObjectId }],
    })
    .project({ user_id: 1, matched_user_id: 1 })
    .toArray()

  const excludedUserIds = new Set<string>()
  excludeIds.forEach((match: any) => {
    excludedUserIds.add(match.user_id.toString())
    excludedUserIds.add(match.matched_user_id.toString())
  })

  // Also exclude blocked users
  const blocks = await db
    .collection(CollectionNames.USER_BLOCKS)
    .find({
      $or: [{ blocker_id: userObjectId }, { blocked_id: userObjectId }],
    })
    .project({ blocker_id: 1, blocked_id: 1 })
    .toArray()

  blocks.forEach((block: any) => {
    excludedUserIds.add(block.blocker_id.toString())
    excludedUserIds.add(block.blocked_id.toString())
  })

  if (excludedUserIds.size > 0) {
    matchQuery._id.$nin = Array.from(excludedUserIds).map((id: any) => new ObjectId(id))
  }

  // Find potential matches
  const potentialMatches = await db
    .collection(CollectionNames.USERS)
    .find(matchQuery)
    .limit(batchSize * 3) // Get more than needed for scoring
    .toArray()

  // Score and sort matches
  const scoredMatches = potentialMatches.map((candidate: any) => {
    let score = 0

    // Tribe compatibility (highest weight)
    if (user.tribe_id && candidate.tribe_id?.equals(user.tribe_id)) {
      score += 50
    }

    // Interest overlap
    const userInterests = new Set(user.interests || [])
    const candidateInterests = candidate.interests || []
    const commonInterests = candidateInterests.filter((i: string) =>
      userInterests.has(i)
    )
    score += commonInterests.length * 5

    // Proximity bonus (if location available)
    // Would need actual distance calculation here
    // For now, just check if both have locations
    if (user.location && candidate.location) {
      score += 10
    }

    // Profile completeness
    const profileFields = [
      'bio',
      'height',
      'education',
      'occupation',
      'religion',
      'languages',
    ]
    const completedFields = profileFields.filter(
      (field) => candidate[field] && candidate[field] !== ''
    )
    score += completedFields.length * 2

    // Account age bonus (prefer established users)
    const accountAgeDays =
      (Date.now() - candidate.created_at.getTime()) / (1000 * 60 * 60 * 24)
    if (accountAgeDays > 30) score += 5
    if (accountAgeDays > 90) score += 5

    return {
      candidateId: candidate._id,
      score,
    }
  })

  // Sort by score and take top matches
  scoredMatches.sort((a: any, b: any) => b.score - a.score)
  const topMatches = scoredMatches.slice(0, batchSize)

  // Insert new matches
  const matchDocs = topMatches.map((match: any) => ({
    user_id: userObjectId,
    matched_user_id: match.candidateId,
    match_score: match.score,
    status: 'pending',
    created_at: new Date(),
    expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
  }))

  if (matchDocs.length > 0) {
    await db.collection(CollectionNames.USER_MATCHES).insertMany(matchDocs)
  }

  console.log(`[match-gen] Generated ${matchDocs.length} matches for user ${userId}`)

  return {
    matchCount: matchDocs.length,
    averageScore: matchDocs.length > 0
      ? matchDocs.reduce((sum, m) => sum + m.match_score, 0) / matchDocs.length
      : 0,
  }
}

/**
 * Process match generation job
 */
async function processMatchGeneration(job: Job<MatchGenerationJobData>) {
  const { userId, batchSize = 50 } = job.data

  console.log(`[match-gen] Processing job for user ${userId}`, {
    jobId: job.id,
    batchSize,
  })

  try {
    const result = await generateMatchesForUser(userId, batchSize)

    await job.updateProgress(100)

    return result
  } catch (error) {
    console.error(`[match-gen] Failed for user ${userId}`, { error })
    throw error
  }
}

/**
 * Process batch match generation job
 */
async function processBatchMatchGeneration(job: Job<BatchMatchGenerationJobData>) {
  const { userIds, startAfter, limit = 1000 } = job.data

  console.log('[match-gen] Processing batch job', {
    jobId: job.id,
    userIds: userIds?.length,
    startAfter,
    limit,
  })

  const db = await getDb()

  // Get users to process
  let users: any[]

  if (userIds) {
    // Process specific users
    users = await db
      .collection(CollectionNames.USERS)
      .find({ _id: { $in: userIds.map((id: any) => new ObjectId(id)) } })
      .toArray()
  } else {
    // Process all active users
    const query: any = {
      deleted_at: { $exists: false },
      status: 'active',
    }

    if (startAfter) {
      query._id = { $gt: new ObjectId(startAfter) }
    }

    users = await db
      .collection(CollectionNames.USERS)
      .find(query)
      .limit(limit)
      .toArray()
  }

  console.log(`[match-gen] Processing ${users.length} users`)

  let processed = 0
  let failed = 0

  for (const user of users) {
    try {
      await generateMatchesForUser(user._id.toString())
      processed++

      // Update progress
      await job.updateProgress(Math.floor((processed / users.length) * 100))

      // Small delay to avoid overwhelming the database
      if (processed % 10 === 0) {
        await new Promise((resolve) => setTimeout(resolve, 100))
      }
    } catch (error) {
      console.error(`[match-gen] Failed for user ${user._id}`, { error })
      failed++
    }
  }

  console.log('[match-gen] Batch complete', {
    jobId: job.id,
    processed,
    failed,
    total: users.length,
  })

  return {
    processed,
    failed,
    total: users.length,
    lastUserId: users[users.length - 1]?._id.toString(),
  }
}

/**
 * Create match generation worker
 */
export function createMatchGenerationWorker() {
  const worker = new Worker(
    QueueNames.MATCH_GENERATION,
    async (job) => {
      if (job.name === 'batch') {
        return processBatchMatchGeneration(job)
      } else {
        return processMatchGeneration(job)
      }
    },
    {
      connection: redisConnection,
      concurrency: 5, // Process 5 users in parallel
      limiter: {
        max: 100, // Max 100 jobs
        duration: 60000, // per minute
      },
    }
  )

  worker.on('ready', () => {
    console.log('[match-gen] Worker ready')
  })

  worker.on('completed', (job) => {
    console.log('[match-gen] Job completed', { jobId: job.id })
  })

  worker.on('failed', (job, error) => {
    console.error('[match-gen] Job failed', { jobId: job?.id, error })
  })

  return worker
}

/**
 * Queue a match generation job for a single user
 */
export async function queueMatchGeneration(userId: string, priority?: 'high' | 'normal' | 'low') {
  const queue = getQueue(QueueNames.MATCH_GENERATION)

  const job = await queue.add(
    'generate',
    { userId, priority },
    {
      priority: priority === 'high' ? 1 : priority === 'low' ? 3 : 2,
      jobId: `match-gen-${userId}-${Date.now()}`,
    }
  )

  console.log(`[match-gen] Queued job for user ${userId}`, { jobId: job.id })

  return job
}

/**
 * Queue a batch match generation job
 */
export async function queueBatchMatchGeneration(
  options: BatchMatchGenerationJobData = {}
) {
  const queue = getQueue(QueueNames.MATCH_GENERATION)

  const job = await queue.add('batch', options, {
    jobId: `match-gen-batch-${Date.now()}`,
  })

  console.log('[match-gen] Queued batch job', { jobId: job.id })

  return job
}

/**
 * Schedule daily match generation for all users
 * Call this from a cron job or scheduler
 */
export async function scheduleDailyMatchGeneration() {
  const queue = getQueue(QueueNames.MATCH_GENERATION)

  // Add repeatable job (runs daily at 3am)
  await queue.add(
    'batch',
    { limit: 1000 },
    {
      repeat: {
        pattern: '0 3 * * *', // 3am daily
      },
      jobId: 'daily-match-generation',
    }
  )

  console.log('[match-gen] Scheduled daily batch job')
}


