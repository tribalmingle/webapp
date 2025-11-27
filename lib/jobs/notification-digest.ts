/**
 * Notification Digest Worker
 * Sends daily/weekly digest emails with aggregated notifications
 */

import { Queue, Worker } from 'bullmq'
import { getMongoDb } from '@/lib/mongodb'
import { CollectionNames } from '@/lib/data/collection-names'
import { ObjectId } from 'mongodb'
import { sendNotification, type NotificationPayload } from '@/lib/services/notification-service'

const REDIS_HOST = process.env.REDIS_HOST || 'localhost'
const REDIS_PORT = parseInt(process.env.REDIS_PORT || '6379', 10)

const connection = {
  host: REDIS_HOST,
  port: REDIS_PORT,
}

export type DigestFrequency = 'daily' | 'weekly'

export interface NotificationDigestJob {
  userId: string
  frequency: DigestFrequency
}

/**
 * Queue for notification digest jobs
 */
export const notificationDigestQueue = new Queue<NotificationDigestJob>('notification-digest', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: {
      age: 86400, // Keep completed jobs for 1 day
      count: 5000,
    },
    removeOnFail: {
      age: 604800, // Keep failed jobs for 7 days
    },
  },
})

/**
 * Generate notification digest content
 */
async function generateDigestContent(
  userId: string,
  frequency: DigestFrequency
): Promise<{
  hasContent: boolean
  matches: number
  messages: number
  likes: number
  events: number
  highlights: any[]
} | null> {
  const db = await getMongoDb()
  const userObjectId = new ObjectId(userId)

  // Determine time range
  const now = new Date()
  const startDate = new Date()
  if (frequency === 'daily') {
    startDate.setDate(now.getDate() - 1)
  } else {
    startDate.setDate(now.getDate() - 7)
  }

  // Get user preferences
  const user = await db
    .collection(CollectionNames.USERS)
    .findOne({ _id: userObjectId })

  if (!user) {
    return null
  }

  // Check if user has opted out of digest emails
  const subscription = await db
    .collection(CollectionNames.SUBSCRIPTIONS)
    .findOne({ user_id: userObjectId })

  if (subscription?.preferences?.digest_emails === false) {
    console.log('[notification-digest] User opted out', { userId })
    return null
  }

  // Count new matches
  const matchCount = await db
    .collection(CollectionNames.USER_MATCHES)
    .countDocuments({
      $or: [{ user_id: userObjectId }, { matched_user_id: userObjectId }],
      created_at: { $gte: startDate },
      status: 'active',
    })

  // Count new messages
  const messageCount = await db
    .collection(CollectionNames.CHAT_MESSAGES)
    .countDocuments({
      recipient_id: userObjectId,
      created_at: { $gte: startDate },
      read_at: null,
    })

  // Count new likes
  const likeCount = await db
    .collection(CollectionNames.USER_MATCHES)
    .countDocuments({
      matched_user_id: userObjectId,
      created_at: { $gte: startDate },
      status: 'pending',
    })

  // Count upcoming events
  const eventCount = await db
    .collection('event_registrations')
    .countDocuments({
      user_id: userObjectId,
      status: 'confirmed',
    })

  // Get highlights (top 5 most interesting notifications)
  const highlights = await db
    .collection(CollectionNames.NOTIFICATIONS)
    .find({
      user_id: userObjectId,
      created_at: { $gte: startDate },
      read_at: null,
      type: { $in: ['match', 'message', 'like', 'super_like', 'event_invite'] },
    })
    .sort({ priority: -1, created_at: -1 })
    .limit(5)
    .toArray()

  const hasContent = matchCount > 0 || messageCount > 0 || likeCount > 0 || highlights.length > 0

  return {
    hasContent,
    matches: matchCount,
    messages: messageCount,
    likes: likeCount,
    events: eventCount,
    highlights,
  }
}

/**
 * Process notification digest job
 */
export async function processNotificationDigest(job: NotificationDigestJob): Promise<{
  sent: boolean
  reason?: string
}> {
  const { userId, frequency } = job

  console.log('[notification-digest] Processing digest', {
    userId,
    frequency,
  })

  // Generate digest content
  const digest = await generateDigestContent(userId, frequency)

  if (!digest) {
    return {
      sent: false,
      reason: 'user_not_found',
    }
  }

  if (!digest.hasContent) {
    console.log('[notification-digest] No content for digest', { userId })
    return {
      sent: false,
      reason: 'no_content',
    }
  }

  // Send digest notification (email)
  const notification: NotificationPayload = {
    userId,
    title: frequency === 'daily' ? 'Your Daily Update' : 'Your Weekly Update',
    body: `You have ${digest.matches} new matches, ${digest.messages} unread messages, and ${digest.likes} new likes`,
    category: 'growth',
    data: {
      matches: digest.matches,
      messages: digest.messages,
      likes: digest.likes,
      events: digest.events,
      highlights: digest.highlights.map((h: any) => ({
        type: h.type,
        title: h.title,
        created_at: h.created_at,
      })),
    },
    channels: ['email'], // Digest only via email
  }

  await sendNotification(notification)

  console.log('[notification-digest] Digest sent', {
    userId,
    frequency,
    content: {
      matches: digest.matches,
      messages: digest.messages,
      likes: digest.likes,
    },
  })

  return {
    sent: true,
  }
}

/**
 * Queue notification digest for a user
 */
export async function queueNotificationDigest(userId: string, frequency: DigestFrequency) {
  await notificationDigestQueue.add(
    'send-digest',
    { userId, frequency },
    {
      jobId: `digest-${frequency}-${userId}`,
    }
  )
  console.log('[notification-digest] Job queued', { userId, frequency })
}

/**
 * Queue digests for all users
 */
export async function queueAllUserDigests(frequency: DigestFrequency) {
  const db = await getMongoDb()

  // Get all active users
  const users = await db
    .collection(CollectionNames.USERS)
    .find({
      deleted_at: null,
      email_verified: true,
    })
    .project({ _id: 1 })
    .toArray()

  console.log('[notification-digest] Queuing digests for all users', {
    frequency,
    userCount: users.length,
  })

  // Queue digest for each user
  for (const user of users) {
    await queueNotificationDigest(user._id.toString(), frequency)
  }

  return users.length
}

/**
 * Schedule daily digests (runs at 8 AM daily)
 */
export async function scheduleDailyDigests() {
  await notificationDigestQueue.add(
    'daily-digests',
    { userId: 'all', frequency: 'daily' as DigestFrequency },
    {
      repeat: {
        pattern: '0 8 * * *', // 8 AM every day
      },
      jobId: 'daily-digests-cron',
    }
  )
  console.log('[notification-digest] Daily digest cron scheduled')
}

/**
 * Schedule weekly digests (runs at 9 AM every Monday)
 */
export async function scheduleWeeklyDigests() {
  await notificationDigestQueue.add(
    'weekly-digests',
    { userId: 'all', frequency: 'weekly' as DigestFrequency },
    {
      repeat: {
        pattern: '0 9 * * 1', // 9 AM every Monday
      },
      jobId: 'weekly-digests-cron',
    }
  )
  console.log('[notification-digest] Weekly digest cron scheduled')
}

/**
 * Worker to process notification digest jobs
 */
export const notificationDigestWorker = new Worker<NotificationDigestJob>(
  'notification-digest',
  async (job) => {
    // Handle "all users" digest jobs
    if (job.data.userId === 'all') {
      const count = await queueAllUserDigests(job.data.frequency)
      return { queued: count }
    }

    // Process individual user digest
    const result = await processNotificationDigest(job.data)
    return result
  },
  {
    connection,
    concurrency: 10, // Process 10 digest jobs concurrently
    limiter: {
      max: 100,
      duration: 60000, // Max 100 digests per minute
    },
  }
)

notificationDigestWorker.on('completed', (job) => {
  console.log(`[notification-digest] Job ${job.id} completed`, job.returnvalue)
})

notificationDigestWorker.on('failed', (job, err) => {
  console.error(`[notification-digest] Job ${job?.id} failed`, err)
})

