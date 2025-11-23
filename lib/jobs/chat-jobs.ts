/**
 * Phase 5 Chat Background Jobs
 * Handles disappearing messages, message recall windows, S3 cleanup, and analytics
 */

import { getMongoDb } from '@/lib/mongodb'
import { withSpan } from '@/lib/observability/tracing'
import { AnalyticsService } from '@/lib/services/analytics-service'

/**
 * Job: Clean up expired disappearing messages
 * Runs every 5 minutes
 */
export async function runDisappearingMessagesJob() {
  return withSpan('job.disappearingMessages', async () => {
    const db = await getMongoDb()
    const messages = db.collection('messages')

    const now = new Date()
    
    // Find expired messages
    const expiredMessages = await messages
      .find({
        expiresAt: { $lte: now },
        status: { $ne: 'expired' },
      })
      .toArray()

    if (expiredMessages.length === 0) {
      console.log('[Job] No expired messages found')
      return { deletedCount: 0 }
    }

    // Mark as expired (soft delete)
    const result = await messages.updateMany(
      { expiresAt: { $lte: now }, status: { $ne: 'expired' } },
      {
        $set: {
          status: 'expired',
          content: '[Message expired]',
          updatedAt: now,
        },
        $unset: {
          attachments: '',
        },
      }
    )

    console.log(`[Job] Expired ${result.modifiedCount} disappearing messages`)

    await AnalyticsService.track({
      eventType: 'job.disappearing_messages.completed',
      properties: {
        expiredCount: result.modifiedCount,
      },
    })

    return { deletedCount: result.modifiedCount }
  })
}

/**
 * Job: Close message recall windows
 * Runs every 15 minutes
 */
export async function runMessageRecallWindowJob() {
  return withSpan('job.messageRecallWindow', async () => {
    const db = await getMongoDb()
    const messages = db.collection('messages')

    const now = new Date()
    const RECALL_WINDOW_MS = 15 * 60 * 1000 // 15 minutes
    const cutoffTime = new Date(now.getTime() - RECALL_WINDOW_MS)

    // Messages eligible for recall but window has passed
    const result = await messages.updateMany(
      {
        createdAt: { $lte: cutoffTime },
        status: 'sent',
        recallWindowClosed: { $exists: false },
      },
      {
        $set: {
          recallWindowClosed: true,
          updatedAt: now,
        },
      }
    )

    console.log(`[Job] Closed recall window for ${result.modifiedCount} messages`)

    return { closedCount: result.modifiedCount }
  })
}

/**
 * Job: Purge orphaned S3 attachments
 * Runs daily at 2 AM
 */
export async function runAttachmentCleanupJob() {
  return withSpan('job.attachmentCleanup', async () => {
    const db = await getMongoDb()
    const messages = db.collection('messages')

    const now = new Date()
    const RETENTION_DAYS = 90
    const cutoffDate = new Date(now.getTime() - RETENTION_DAYS * 24 * 60 * 60 * 1000)

    // Find messages with attachments older than retention period
    const oldMessages = await messages
      .find({
        createdAt: { $lte: cutoffDate },
        'attachments.0': { $exists: true },
        attachmentsArchived: { $ne: true },
      })
      .toArray()

    let archivedCount = 0
    const s3KeysToDelete: string[] = []

    for (const message of oldMessages) {
      if (message.attachments) {
        for (const attachment of message.attachments) {
          if (attachment.s3Key) {
            s3KeysToDelete.push(attachment.s3Key)
          }
        }
      }
      archivedCount++
    }

    // Mark messages as archived (actual S3 deletion would happen in separate service)
    if (oldMessages.length > 0) {
      await messages.updateMany(
        { _id: { $in: oldMessages.map(m => m._id) } },
        {
          $set: {
            attachmentsArchived: true,
            archivedAt: now,
          },
          $unset: {
            attachments: '',
          },
        }
      )
    }

    console.log(`[Job] Archived ${archivedCount} messages, marked ${s3KeysToDelete.length} S3 keys for deletion`)

    await AnalyticsService.track({
      eventType: 'job.attachment_cleanup.completed',
      properties: {
        archivedCount,
        s3KeysCount: s3KeysToDelete.length,
      },
    })

    return {
      archivedCount,
      s3KeysToDelete,
    }
  })
}

/**
 * Job: Generate messaging analytics snapshots
 * Runs daily at 1 AM
 */
export async function runMessagingAnalyticsJob() {
  return withSpan('job.messagingAnalytics', async () => {
    const db = await getMongoDb()
    const messages = db.collection('messages')

    const now = new Date()
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    yesterday.setHours(0, 0, 0, 0)
    const today = new Date(yesterday)
    today.setDate(today.getDate() + 1)

    // Count messages by type
    const messageStats = await messages.aggregate([
      {
        $match: {
          createdAt: { $gte: yesterday, $lt: today },
        },
      },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          avgResponseTime: {
            $avg: {
              $subtract: ['$createdAt', '$receivedAt'],
            },
          },
        },
      },
    ]).toArray()

    // Count voice notes
    const voiceNoteCount = await messages.countDocuments({
      type: 'voice',
      createdAt: { $gte: yesterday, $lt: today },
    })

    // Count translated messages
    const translatedCount = await messages.countDocuments({
      translationState: { $exists: true },
      createdAt: { $gte: yesterday, $lt: today },
    })

    // Count recalled messages
    const recalledCount = await messages.countDocuments({
      status: 'recalled',
      recalledAt: { $gte: yesterday, $lt: today },
    })

    const snapshot = {
      date: yesterday,
      messageStats,
      voiceNoteCount,
      translatedCount,
      recalledCount,
      createdAt: now,
    }

    // Store snapshot
    await db.collection('messaging_analytics_snapshots').insertOne(snapshot)

    console.log('[Job] Created messaging analytics snapshot:', snapshot)

    return snapshot
  })
}

/**
 * Workflow: Handle disappearing message timer
 * This would be implemented as a Temporal workflow
 */
export async function startDisappearingMessageWorkflow(messageId: string, expirySeconds: number) {
  // Stub for Temporal workflow
  // In production, this would:
  // 1. Schedule a delayed activity to expire the message
  // 2. Handle cancellation if message is deleted early
  // 3. Support retries and error handling
  
  console.log(`[Workflow] Started disappearing message timer for ${messageId}, expires in ${expirySeconds}s`)
  
  return {
    workflowId: `disappearing-message-${messageId}`,
    messageId,
    expirySeconds,
    scheduledAt: new Date(),
  }
}

/**
 * Workflow: Handle message recall
 * This would be implemented as a Temporal workflow
 */
export async function startMessageRecallWorkflow(messageId: string) {
  // Stub for Temporal workflow
  // In production, this would:
  // 1. Verify recall is within 15-minute window
  // 2. Update message status
  // 3. Notify recipient via Socket.IO
  // 4. Track analytics
  
  console.log(`[Workflow] Started message recall workflow for ${messageId}`)
  
  return {
    workflowId: `message-recall-${messageId}`,
    messageId,
    initiatedAt: new Date(),
  }
}
