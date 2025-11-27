/**
 * Notification Scheduler Background Jobs
 * Handles scheduled and batched notification delivery
 */

import { Worker, Job } from 'bullmq'
import { getQueue, redisConnection, QueueNames } from './queue-setup'
import {
  sendNotification,
  type NotificationPayload,
} from '@/lib/services/notification-service'
import { getDb } from '@/lib/db/mongodb'
import { CollectionNames } from '@/lib/data/collection-names'
import { ObjectId } from 'mongodb'

// Job data types
export interface ScheduledNotificationJobData {
  notificationId: string
  scheduledFor: Date
}

export interface BatchNotificationJobData {
  userIds: string[]
  notification: NotificationPayload
  batchSize?: number
}

export interface DigestNotificationJobData {
  userId: string
  digestType: 'daily' | 'weekly'
}

/**
 * Process scheduled notification job
 */
async function processScheduledNotification(job: Job<ScheduledNotificationJobData>) {
  const { notificationId } = job.data

  console.log(`[notif-scheduler] Processing scheduled notification ${notificationId}`, {
    jobId: job.id,
  })

  const db = await getDb()
  const notification = await db
    .collection(CollectionNames.NOTIFICATIONS)
    .findOne({ _id: new ObjectId(notificationId) })

  if (!notification) {
    throw new Error(`Notification not found: ${notificationId}`)
  }

  // Check if already sent
  if (notification.sent_at) {
    console.log(`[notif-scheduler] Notification already sent ${notificationId}`)
    return { alreadySent: true }
  }

  // Send notification
  try {
    await sendNotification({
      userId: notification.user_id.toString(),
      title: notification.title,
      body: notification.body,
      category: notification.category,
      data: notification.data,
      channels: notification.channels || ['push', 'in_app'],
    })

    // Update notification status
    await db.collection(CollectionNames.NOTIFICATIONS).updateOne(
      { _id: new ObjectId(notificationId) },
      {
        $set: {
          sent_at: new Date(),
          status: 'sent',
        },
      }
    )

    console.log(`[notif-scheduler] Notification sent ${notificationId}`)

    return { sent: true }
  } catch (error) {
    console.error(`[notif-scheduler] Failed to send notification ${notificationId}`, {
      error,
    })

    // Update notification status
    await db.collection(CollectionNames.NOTIFICATIONS).updateOne(
      { _id: new ObjectId(notificationId) },
      {
        $set: {
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      }
    )

    throw error
  }
}

/**
 * Process batch notification job
 */
async function processBatchNotification(job: Job<BatchNotificationJobData>) {
  const { userIds, notification, batchSize = 100 } = job.data

  console.log(`[notif-scheduler] Processing batch notification`, {
    jobId: job.id,
    userCount: userIds.length,
    batchSize,
  })

  let sent = 0
  let failed = 0

  // Process in batches to avoid overwhelming the system
  for (let i = 0; i < userIds.length; i += batchSize) {
    const batch = userIds.slice(i, i + batchSize)

    const promises = batch.map(async (userId) => {
      try {
        await sendNotification({
          ...notification,
          userId,
        })
        sent++
      } catch (error) {
        console.error(`[notif-scheduler] Failed to send to user ${userId}`, {
          error,
        })
        failed++
      }
    })

    await Promise.allSettled(promises)

    // Update progress
    await job.updateProgress(Math.floor(((i + batch.length) / userIds.length) * 100))

    // Small delay between batches
    if (i + batchSize < userIds.length) {
      await new Promise((resolve) => setTimeout(resolve, 500))
    }
  }

  console.log(`[notif-scheduler] Batch complete`, {
    jobId: job.id,
    sent,
    failed,
    total: userIds.length,
  })

  return { sent, failed, total: userIds.length }
}

/**
 * Process digest notification job
 */
async function processDigestNotification(job: Job<DigestNotificationJobData>) {
  const { userId, digestType } = job.data

  console.log(`[notif-scheduler] Processing ${digestType} digest for user ${userId}`, {
    jobId: job.id,
  })

  const db = await getDb()
  const userObjectId = new ObjectId(userId)

  // Calculate time window
  const now = new Date()
  const cutoffDate = new Date()
  if (digestType === 'daily') {
    cutoffDate.setDate(cutoffDate.getDate() - 1)
  } else {
    cutoffDate.setDate(cutoffDate.getDate() - 7)
  }

  // Get user's unread notifications
  const notifications = await db
    .collection(CollectionNames.NOTIFICATIONS)
    .find({
      user_id: userObjectId,
      created_at: { $gte: cutoffDate, $lt: now },
      read_at: { $exists: false },
      category: { $in: ['match', 'message', 'event'] },
    })
    .sort({ created_at: -1 })
    .limit(10)
    .toArray()

  if (notifications.length === 0) {
    console.log(`[notif-scheduler] No notifications for digest ${userId}`)
    return { sent: false, reason: 'no_notifications' }
  }

  // Group by category
  const grouped: Record<string, any[]> = {}
  notifications.forEach((notif: any) => {
    if (!grouped[notif.category]) {
      grouped[notif.category] = []
    }
    grouped[notif.category].push(notif)
  })

  // Build digest content
  const digestLines: string[] = []

  if (grouped.match) {
    digestLines.push(
      `You have ${grouped.match.length} new match${grouped.match.length > 1 ? 'es' : ''}!`
    )
  }

  if (grouped.message) {
    digestLines.push(
      `You have ${grouped.message.length} unread message${grouped.message.length > 1 ? 's' : ''}`
    )
  }

  if (grouped.event) {
    digestLines.push(
      `${grouped.event.length} upcoming event${grouped.event.length > 1 ? 's' : ''}`
    )
  }

  const digestBody = digestLines.join('\n')

  // Send digest notification
  try {
    await sendNotification({
      userId,
      title: digestType === 'daily' ? 'Your Daily Digest' : 'Your Weekly Digest',
      body: digestBody,
      category: 'growth',
      data: {
        type: 'digest',
        digestType,
        notificationCount: notifications.length,
      },
      channels: ['email', 'push'],
    })

    console.log(`[notif-scheduler] Digest sent to user ${userId}`)

    return {
      sent: true,
      notificationCount: notifications.length,
    }
  } catch (error) {
    console.error(`[notif-scheduler] Failed to send digest to user ${userId}`, {
      error,
    })
    throw error
  }
}

/**
 * Create notification scheduler worker
 */
export function createNotificationSchedulerWorker() {
  const worker = new Worker(
    QueueNames.NOTIFICATIONS,
    async (job) => {
      switch (job.name) {
        case 'scheduled':
          return processScheduledNotification(job)
        case 'batch':
          return processBatchNotification(job)
        case 'digest':
          return processDigestNotification(job)
        default:
          throw new Error(`Unknown job type: ${job.name}`)
      }
    },
    {
      connection: redisConnection,
      concurrency: 10, // Process 10 notifications in parallel
      limiter: {
        max: 500, // Max 500 notifications
        duration: 60000, // per minute
      },
    }
  )

  worker.on('ready', () => {
    console.log('[notif-scheduler] Worker ready')
  })

  worker.on('completed', (job) => {
    console.log('[notif-scheduler] Job completed', { jobId: job.id })
  })

  worker.on('failed', (job, error) => {
    console.error('[notif-scheduler] Job failed', { jobId: job?.id, error })
  })

  return worker
}

/**
 * Queue a scheduled notification
 */
export async function queueScheduledNotification(
  notificationId: string,
  scheduledFor: Date
) {
  const queue = getQueue(QueueNames.NOTIFICATIONS)

  const delay = scheduledFor.getTime() - Date.now()

  const job = await queue.add(
    'scheduled',
    { notificationId, scheduledFor },
    {
      delay: Math.max(0, delay),
      jobId: `scheduled-notif-${notificationId}`,
    }
  )

  console.log(`[notif-scheduler] Queued scheduled notification ${notificationId}`, {
    jobId: job.id,
    scheduledFor,
  })

  return job
}

/**
 * Queue a batch notification
 */
export async function queueBatchNotification(
  userIds: string[],
  notification: NotificationPayload,
  batchSize = 100
) {
  const queue = getQueue(QueueNames.NOTIFICATIONS)

  const job = await queue.add(
    'batch',
    { userIds, notification, batchSize },
    {
      jobId: `batch-notif-${Date.now()}`,
    }
  )

  console.log(`[notif-scheduler] Queued batch notification`, {
    jobId: job.id,
    userCount: userIds.length,
  })

  return job
}

/**
 * Queue a digest notification
 */
export async function queueDigestNotification(
  userId: string,
  digestType: 'daily' | 'weekly'
) {
  const queue = getQueue(QueueNames.NOTIFICATIONS)

  const job = await queue.add(
    'digest',
    { userId, digestType },
    {
      jobId: `digest-${digestType}-${userId}-${Date.now()}`,
    }
  )

  console.log(`[notif-scheduler] Queued ${digestType} digest for user ${userId}`, {
    jobId: job.id,
  })

  return job
}

/**
 * Schedule daily digests for all users who have them enabled
 */
export async function scheduleDailyDigests() {
  const queue = getQueue(QueueNames.NOTIFICATIONS)

  // Add repeatable job (runs daily at 8am)
  await queue.add(
    'digest-batch',
    { digestType: 'daily' },
    {
      repeat: {
        pattern: '0 8 * * *', // 8am daily
      },
      jobId: 'daily-digests',
    }
  )

  console.log('[notif-scheduler] Scheduled daily digests')
}

/**
 * Schedule weekly digests for all users who have them enabled
 */
export async function scheduleWeeklyDigests() {
  const queue = getQueue(QueueNames.NOTIFICATIONS)

  // Add repeatable job (runs Monday at 9am)
  await queue.add(
    'digest-batch',
    { digestType: 'weekly' },
    {
      repeat: {
        pattern: '0 9 * * 1', // Monday at 9am
      },
      jobId: 'weekly-digests',
    }
  )

  console.log('[notif-scheduler] Scheduled weekly digests')
}

