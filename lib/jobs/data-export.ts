/**
 * Data Export Background Jobs
 * GDPR compliance - user data export
 */

import { Worker, Job } from 'bullmq'
import { getQueue, redisConnection, QueueNames } from './queue-setup'
import { getDb } from '@/lib/db/mongodb'
import { CollectionNames } from '@/lib/data/collection-names'
import { ObjectId } from 'mongodb'
import { uploadToS3 } from '@/lib/vendors/s3-client'
import { sendNotification } from '@/lib/services/notification-service'

// Job data types
export interface DataExportJobData {
  userId: string
  requestedAt: Date
  format?: 'json' | 'csv'
}

/**
 * Export all user data
 */
async function exportUserData(userId: string) {
  const db = await getDb()
  const userObjectId = new ObjectId(userId)

  console.log(`[data-export] Exporting data for user ${userId}`)

  // Collect all user data
  const userData: any = {
    exportedAt: new Date().toISOString(),
    userId,
  }

  // User profile
  const user = await db
    .collection(CollectionNames.USERS)
    .findOne({ _id: userObjectId })

  if (!user) {
    throw new Error(`User not found: ${userId}`)
  }

  userData.profile = {
    email: user.email,
    phone: user.phone,
    first_name: user.first_name,
    last_name: user.last_name,
    birth_date: user.birth_date,
    gender: user.gender,
    tribe_id: user.tribe_id?.toString(),
    location: user.location,
    bio: user.bio,
    interests: user.interests,
    languages: user.languages,
    height: user.height,
    education: user.education,
    occupation: user.occupation,
    religion: user.religion,
    relationship_status: user.relationship_status,
    children: user.children,
    smoking: user.smoking,
    drinking: user.drinking,
    created_at: user.created_at,
    last_active_at: user.last_active_at,
  }

  // User preferences
  const preferences = await db
    .collection(CollectionNames.USER_PREFERENCES)
    .findOne({ user_id: userObjectId })

  userData.preferences = preferences || {}

  // Photos
  const photos = await db
    .collection(CollectionNames.USER_PHOTOS)
    .find({ user_id: userObjectId })
    .toArray()

  userData.photos = photos.map((photo: any) => ({
    url: photo.photo_url,
    is_primary: photo.is_primary,
    uploaded_at: photo.uploaded_at,
  }))

  // Matches
  const matches = await db
    .collection(CollectionNames.USER_MATCHES)
    .find({
      $or: [{ user_id: userObjectId }, { matched_user_id: userObjectId }],
    })
    .toArray()

  userData.matches = matches.map((match: any) => ({
    matched_with: match.user_id.equals(userObjectId)
      ? match.matched_user_id.toString()
      : match.user_id.toString(),
    status: match.status,
    created_at: match.created_at,
  }))

  // Messages
  const messages = await db
    .collection(CollectionNames.CHAT_MESSAGES)
    .find({ sender_id: userObjectId })
    .sort({ created_at: -1 })
    .limit(10000) // Limit to last 10k messages
    .toArray()

  userData.messages = messages.map((msg: any) => ({
    recipient_id: msg.recipient_id?.toString(),
    conversation_id: msg.conversation_id?.toString(),
    content: msg.content,
    message_type: msg.message_type,
    created_at: msg.created_at,
  }))

  // Gifts sent
  const giftsSent = await db
    .collection(CollectionNames.GIFTS)
    .find({ sender_id: userObjectId })
    .toArray()

  userData.gifts_sent = giftsSent.map((gift: any) => ({
    recipient_id: gift.recipient_id.toString(),
    gift_type_id: gift.gift_type_id.toString(),
    created_at: gift.created_at,
  }))

  // Gifts received
  const giftsReceived = await db
    .collection(CollectionNames.GIFTS)
    .find({ recipient_id: userObjectId })
    .toArray()

  userData.gifts_received = giftsReceived.map((gift: any) => ({
    sender_id: gift.sender_id.toString(),
    gift_type_id: gift.gift_type_id.toString(),
    created_at: gift.created_at,
  }))

  // Events attended
  const eventRSVPs = await db
    .collection(CollectionNames.EVENT_RSVPS)
    .find({ user_id: userObjectId })
    .toArray()

  userData.events = eventRSVPs.map((rsvp: any) => ({
    event_id: rsvp.event_id.toString(),
    status: rsvp.status,
    created_at: rsvp.created_at,
  }))

  // Posts
  const posts = await db
    .collection(CollectionNames.COMMUNITY_POSTS)
    .find({ author_id: userObjectId })
    .toArray()

  userData.posts = posts.map((post: any) => ({
    content: post.content,
    post_type: post.post_type,
    created_at: post.created_at,
  }))

  // Transactions
  const transactions = await db
    .collection(CollectionNames.TRANSACTIONS)
    .find({ user_id: userObjectId })
    .toArray()

  userData.transactions = transactions.map((txn: any) => ({
    amount: txn.amount,
    currency: txn.currency,
    product_type: txn.product_type,
    status: txn.status,
    created_at: txn.created_at,
  }))

  // Subscriptions
  const subscriptions = await db
    .collection(CollectionNames.SUBSCRIPTIONS)
    .find({ user_id: userObjectId })
    .toArray()

  userData.subscriptions = subscriptions.map((sub: any) => ({
    plan_id: sub.plan_id.toString(),
    status: sub.status,
    current_period_start: sub.current_period_start,
    current_period_end: sub.current_period_end,
    created_at: sub.created_at,
  }))

  // Safety reports (as reporter)
  const reportsSubmitted = await db
    .collection(CollectionNames.SAFETY_REPORTS)
    .find({ reporter_id: userObjectId })
    .toArray()

  userData.reports_submitted = reportsSubmitted.map((report: any) => ({
    reported_user_id: report.reported_user_id.toString(),
    reason: report.reason,
    created_at: report.created_at,
    status: report.status,
  }))

  // Safety reports (as reported user)
  const reportsReceived = await db
    .collection(CollectionNames.SAFETY_REPORTS)
    .find({ reported_user_id: userObjectId })
    .toArray()

  userData.reports_received = reportsReceived.map((report: any) => ({
    reporter_id: report.reporter_id.toString(),
    reason: report.reason,
    created_at: report.created_at,
    status: report.status,
  }))

  return userData
}

/**
 * Process data export job
 */
async function processDataExport(job: Job<DataExportJobData>) {
  const { userId, requestedAt, format = 'json' } = job.data

  console.log(`[data-export] Processing export for user ${userId}`, {
    jobId: job.id,
    format,
  })

  try {
    // Export data
    await job.updateProgress(10)
    const userData = await exportUserData(userId)

    // Convert to desired format
    await job.updateProgress(50)
    let fileContent: string
    let fileExtension: string
    let contentType: string

    if (format === 'json') {
      fileContent = JSON.stringify(userData, null, 2)
      fileExtension = 'json'
      contentType = 'application/json'
    } else {
      // CSV format (simplified - would need proper CSV conversion)
      fileContent = JSON.stringify(userData, null, 2) // For now, just use JSON
      fileExtension = 'json'
      contentType = 'application/json'
    }

    // Upload to S3
    await job.updateProgress(70)
    const filename = `user-data-export/${userId}/export-${Date.now()}.${fileExtension}`
    const buffer = Buffer.from(fileContent, 'utf-8')

    const uploadResult = await uploadToS3(buffer, filename, {
      contentType,
      metadata: {
        userId,
        exportedAt: new Date().toISOString(),
        requestedAt: requestedAt.toISOString(),
      },
    })

    // Generate signed URL (valid for 7 days)
    const expiresIn = 7 * 24 * 60 * 60 // 7 days in seconds
    const downloadUrl = uploadResult.url // Would need to generate signed URL

    await job.updateProgress(90)

    // Save export record
    const db = await getDb()
    await db.collection(CollectionNames.DATA_EXPORTS).insertOne({
      user_id: new ObjectId(userId),
      file_url: downloadUrl,
      file_size: buffer.length,
      format,
      requested_at: requestedAt,
      completed_at: new Date(),
      expires_at: new Date(Date.now() + expiresIn * 1000),
      status: 'completed',
    })

    // Notify user
    await sendNotification({
      userId,
      title: 'Your Data Export is Ready',
      body: 'Your personal data export is ready for download. The link will expire in 7 days.',
      category: 'safety',
      data: {
        type: 'data_export_ready',
        downloadUrl,
        expiresAt: new Date(Date.now() + expiresIn * 1000).toISOString(),
      },
      channels: ['email', 'push', 'in_app'],
    })

    await job.updateProgress(100)

    console.log(`[data-export] Export complete for user ${userId}`, {
      jobId: job.id,
      fileSize: buffer.length,
      downloadUrl,
    })

    return {
      success: true,
      downloadUrl,
      fileSize: buffer.length,
      expiresAt: new Date(Date.now() + expiresIn * 1000),
    }
  } catch (error) {
    console.error(`[data-export] Failed for user ${userId}`, { error })

    // Save failed export record
    const db = await getDb()
    await db.collection(CollectionNames.DATA_EXPORTS).insertOne({
      user_id: new ObjectId(userId),
      requested_at: requestedAt,
      completed_at: new Date(),
      status: 'failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    })

    // Notify user of failure
    await sendNotification({
      userId,
      title: 'Data Export Failed',
      body: 'We encountered an error while exporting your data. Please try again or contact support.',
      category: 'safety',
      data: {
        type: 'data_export_failed',
      },
      channels: ['email', 'push', 'in_app'],
    })

    throw error
  }
}

/**
 * Create data export worker
 */
export function createDataExportWorker() {
  const worker = new Worker(
    QueueNames.DATA_EXPORT,
    async (job) => {
      return processDataExport(job)
    },
    {
      connection: redisConnection,
      concurrency: 2, // Process 2 exports in parallel
      limiter: {
        max: 20, // Max 20 exports
        duration: 3600000, // per hour
      },
    }
  )

  worker.on('ready', () => {
    console.log('[data-export] Worker ready')
  })

  worker.on('completed', (job) => {
    console.log('[data-export] Job completed', { jobId: job.id })
  })

  worker.on('failed', (job, error) => {
    console.error('[data-export] Job failed', { jobId: job?.id, error })
  })

  return worker
}

/**
 * Queue a data export request
 */
export async function queueDataExport(
  userId: string,
  format: 'json' | 'csv' = 'json'
) {
  const queue = getQueue(QueueNames.DATA_EXPORT)

  const requestedAt = new Date()

  const job = await queue.add(
    'export',
    {
      userId,
      requestedAt,
      format,
    },
    {
      jobId: `data-export-${userId}-${Date.now()}`,
    }
  )

  console.log(`[data-export] Queued export for user ${userId}`, {
    jobId: job.id,
    format,
  })

  // Save export request
  const db = await getDb()
  await db.collection(CollectionNames.DATA_EXPORTS).insertOne({
    user_id: new ObjectId(userId),
    requested_at: requestedAt,
    status: 'pending',
    format,
    job_id: job.id,
  })

  return job
}

