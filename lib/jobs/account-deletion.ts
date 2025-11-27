/**
 * Account Deletion Background Jobs
 * GDPR compliance - right to be forgotten
 */

import { Worker, Job } from 'bullmq'
import { getQueue, redisConnection, QueueNames } from './queue-setup'
import { getDb } from '@/lib/db/mongodb'
import { CollectionNames } from '@/lib/data/collection-names'
import { ObjectId } from 'mongodb'
import { deleteFromS3 } from '@/lib/vendors/s3-client'
import { sendNotification } from '@/lib/services/notification-service'

// Job data types
export interface AccountDeletionJobData {
  userId: string
  requestedAt: Date
  reason?: string
  scheduledFor?: Date
}

/**
 * Delete all user data
 */
async function deleteUserData(userId: string) {
  const db = await getDb()
  const userObjectId = new ObjectId(userId)

  console.log(`[account-deletion] Deleting data for user ${userId}`)

  const deletionLog: any = {
    userId,
    deletedAt: new Date(),
    collections: {},
  }

  // Delete photos from S3
  const photos = await db
    .collection(CollectionNames.USER_PHOTOS)
    .find({ user_id: userObjectId })
    .toArray()

  for (const photo of photos) {
    try {
      // Extract S3 key from URL
      const url = new URL(photo.photo_url)
      const key = url.pathname.substring(1) // Remove leading /
      await deleteFromS3(key)
    } catch (error) {
      console.error(`[account-deletion] Failed to delete photo from S3`, {
        photoId: photo._id,
        error,
      })
    }
  }

  // Delete user photos
  const photosResult = await db
    .collection(CollectionNames.USER_PHOTOS)
    .deleteMany({ user_id: userObjectId })
  deletionLog.CollectionNames.user_photos = photosResult.deletedCount

  // Delete user preferences
  const prefsResult = await db
    .collection(CollectionNames.USER_PREFERENCES)
    .deleteMany({ user_id: userObjectId })
  deletionLog.CollectionNames.user_preferences = prefsResult.deletedCount

  // Delete matches (both directions)
  const matchesResult = await db
    .collection(CollectionNames.USER_MATCHES)
    .deleteMany({
      $or: [{ user_id: userObjectId }, { matched_user_id: userObjectId }],
    })
  deletionLog.CollectionNames.user_matches = matchesResult.deletedCount

  // Delete messages (as sender)
  const messagesResult = await db
    .collection(CollectionNames.CHAT_MESSAGES)
    .deleteMany({ sender_id: userObjectId })
  deletionLog.CollectionNames.chat_messages = messagesResult.deletedCount

  // Anonymize messages (as recipient) - keep for other user's history
  await db.collection(CollectionNames.CHAT_MESSAGES).updateMany(
    { recipient_id: userObjectId },
    {
      $set: {
        recipient_id: null,
        recipient_deleted: true,
      },
    }
  )

  // Delete conversations
  const conversationsResult = await db
    .collection(CollectionNames.CONVERSATIONS)
    .deleteMany({
      participant_ids: userObjectId,
    })
  deletionLog.CollectionNames.conversations = conversationsResult.deletedCount

  // Delete gifts (both sent and received)
  const giftsResult = await db
    .collection(CollectionNames.GIFTS)
    .deleteMany({
      $or: [{ sender_id: userObjectId }, { recipient_id: userObjectId }],
    })
  deletionLog.CollectionNames.gifts = giftsResult.deletedCount

  // Delete event RSVPs
  const rsvpsResult = await db
    .collection(CollectionNames.EVENT_RSVPS)
    .deleteMany({ user_id: userObjectId })
  deletionLog.CollectionNames.event_rsvps = rsvpsResult.deletedCount

  // Delete posts
  const postsResult = await db
    .collection(CollectionNames.COMMUNITY_POSTS)
    .deleteMany({ author_id: userObjectId })
  deletionLog.CollectionNames.community_posts = postsResult.deletedCount

  // Delete comments
  const commentsResult = await db
    .collection(CollectionNames.POST_COMMENTS)
    .deleteMany({ author_id: userObjectId })
  deletionLog.CollectionNames.post_comments = commentsResult.deletedCount

  // Delete reactions
  const reactionsResult = await db
    .collection(CollectionNames.POST_REACTIONS)
    .deleteMany({ user_id: userObjectId })
  deletionLog.CollectionNames.post_reactions = reactionsResult.deletedCount

  // Delete blocks
  const blocksResult = await db
    .collection(CollectionNames.USER_BLOCKS)
    .deleteMany({
      $or: [{ blocker_id: userObjectId }, { blocked_id: userObjectId }],
    })
  deletionLog.CollectionNames.user_blocks = blocksResult.deletedCount

  // Delete reports (as reporter)
  const reportsSubmittedResult = await db
    .collection(CollectionNames.SAFETY_REPORTS)
    .deleteMany({ reporter_id: userObjectId })
  deletionLog.CollectionNames.safety_reports_submitted = reportsSubmittedResult.deletedCount

  // Anonymize reports (as reported user) - keep for moderation records
  await db.collection(CollectionNames.SAFETY_REPORTS).updateMany(
    { reported_user_id: userObjectId },
    {
      $set: {
        reported_user_deleted: true,
      },
    }
  )

  // Cancel subscriptions
  await db.collection(CollectionNames.SUBSCRIPTIONS).updateMany(
    { user_id: userObjectId, status: 'active' },
    {
      $set: {
        status: 'cancelled',
        cancelled_at: new Date(),
      },
    }
  )

  // Delete notifications
  const notificationsResult = await db
    .collection(CollectionNames.NOTIFICATIONS)
    .deleteMany({ user_id: userObjectId })
  deletionLog.CollectionNames.notifications = notificationsResult.deletedCount

  // Delete support tickets
  const ticketsResult = await db
    .collection(CollectionNames.SUPPORT_TICKETS)
    .deleteMany({ user_id: userObjectId })
  deletionLog.CollectionNames.support_tickets = ticketsResult.deletedCount

  // Delete analytics events
  const analyticsResult = await db
    .collection(CollectionNames.ANALYTICS_EVENTS)
    .deleteMany({ user_id: userObjectId })
  deletionLog.CollectionNames.analytics_events = analyticsResult.deletedCount

  // Delete boost purchases
  const boostsResult = await db
    .collection(CollectionNames.BOOSTS)
    .deleteMany({ user_id: userObjectId })
  deletionLog.CollectionNames.boosts = boostsResult.deletedCount

  // Soft delete transactions (keep for financial records)
  await db.collection(CollectionNames.TRANSACTIONS).updateMany(
    { user_id: userObjectId },
    {
      $set: {
        user_deleted: true,
      },
    }
  )

  // Finally, soft delete the user account
  const userResult = await db.collection(CollectionNames.USERS).updateOne(
    { _id: userObjectId },
    {
      $set: {
        deleted_at: new Date(),
        email: `deleted_${userId}@deleted.com`,
        phone: null,
        first_name: 'Deleted',
        last_name: 'User',
        bio: null,
        interests: [],
        location: null,
        // Keep minimal data for legal/audit purposes
        deletion_reason: 'user_requested',
      },
    }
  )
  deletionLog.CollectionNames.users = userResult.modifiedCount

  return deletionLog
}

/**
 * Process account deletion job
 */
async function processAccountDeletion(job: Job<AccountDeletionJobData>) {
  const { userId, requestedAt, reason, scheduledFor } = job.data

  console.log(`[account-deletion] Processing deletion for user ${userId}`, {
    jobId: job.id,
    reason,
    scheduledFor,
  })

  // Check if this is a scheduled deletion
  if (scheduledFor && scheduledFor > new Date()) {
    console.log(`[account-deletion] Deletion scheduled for future, skipping`, {
      userId,
      scheduledFor,
    })
    return { skipped: true, scheduledFor }
  }

  const db = await getDb()

  try {
    // Send final notification before deletion
    await job.updateProgress(5)
    try {
      await sendNotification({
        userId,
        title: 'Account Deletion in Progress',
        body: 'Your account and all associated data are being permanently deleted.',
        category: 'safety',
        data: {
          type: 'account_deletion',
        },
        channels: ['email'],
      })
    } catch (error) {
      console.error(`[account-deletion] Failed to send notification`, { error })
      // Continue with deletion even if notification fails
    }

    // Perform deletion
    await job.updateProgress(10)
    const deletionLog = await deleteUserData(userId)

    await job.updateProgress(90)

    // Save deletion record
    await db.collection(CollectionNames.ACCOUNT_DELETIONS).insertOne({
      user_id: new ObjectId(userId),
      requested_at: requestedAt,
      completed_at: new Date(),
      reason,
      deletion_log: deletionLog,
      status: 'completed',
    })

    await job.updateProgress(100)

    console.log(`[account-deletion] Deletion complete for user ${userId}`, {
      jobId: job.id,
      deletionLog,
    })

    return {
      success: true,
      deletionLog,
    }
  } catch (error) {
    console.error(`[account-deletion] Failed for user ${userId}`, { error })

    // Save failed deletion record
    await db.collection(CollectionNames.ACCOUNT_DELETIONS).insertOne({
      user_id: new ObjectId(userId),
      requested_at: requestedAt,
      completed_at: new Date(),
      reason,
      status: 'failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    })

    throw error
  }
}

/**
 * Create account deletion worker
 */
export function createAccountDeletionWorker() {
  const worker = new Worker(
    QueueNames.ACCOUNT_DELETION,
    async (job) => {
      return processAccountDeletion(job)
    },
    {
      connection: redisConnection,
      concurrency: 1, // Process 1 deletion at a time (heavy operation)
      limiter: {
        max: 10, // Max 10 deletions
        duration: 3600000, // per hour
      },
    }
  )

  worker.on('ready', () => {
    console.log('[account-deletion] Worker ready')
  })

  worker.on('completed', (job) => {
    console.log('[account-deletion] Job completed', { jobId: job.id })
  })

  worker.on('failed', (job, error) => {
    console.error('[account-deletion] Job failed', { jobId: job?.id, error })
  })

  return worker
}

/**
 * Queue an account deletion request
 */
export async function queueAccountDeletion(
  userId: string,
  reason?: string,
  scheduledFor?: Date
) {
  const queue = getQueue(QueueNames.ACCOUNT_DELETION)

  const requestedAt = new Date()

  // Calculate delay if scheduled for future
  const delay = scheduledFor
    ? Math.max(0, scheduledFor.getTime() - Date.now())
    : 0

  const job = await queue.add(
    'delete',
    {
      userId,
      requestedAt,
      reason,
      scheduledFor,
    },
    {
      delay,
      jobId: `account-deletion-${userId}-${Date.now()}`,
    }
  )

  console.log(`[account-deletion] Queued deletion for user ${userId}`, {
    jobId: job.id,
    reason,
    scheduledFor,
  })

  // Save deletion request
  const db = await getDb()
  await db.collection(CollectionNames.ACCOUNT_DELETIONS).insertOne({
    user_id: new ObjectId(userId),
    requested_at: requestedAt,
    scheduled_for: scheduledFor || requestedAt,
    status: 'pending',
    reason,
    job_id: job.id,
  })

  return job
}

/**
 * Cancel a scheduled account deletion
 */
export async function cancelAccountDeletion(userId: string) {
  const db = await getDb()

  // Find pending deletion
  const deletion = await db.collection(CollectionNames.ACCOUNT_DELETIONS).findOne({
    user_id: new ObjectId(userId),
    status: 'pending',
  })

  if (!deletion || !deletion.job_id) {
    throw new Error('No pending deletion found')
  }

  // Remove job from queue
  const queue = getQueue(QueueNames.ACCOUNT_DELETION)
  const job = await queue.getJob(deletion.job_id)

  if (job) {
    await job.remove()
  }

  // Update deletion status
  await db.collection(CollectionNames.ACCOUNT_DELETIONS).updateOne(
    { _id: deletion._id },
    {
      $set: {
        status: 'cancelled',
        cancelled_at: new Date(),
      },
    }
  )

  console.log(`[account-deletion] Cancelled deletion for user ${userId}`)

  return { cancelled: true }
}
