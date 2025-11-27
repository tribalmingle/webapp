/**
 * API: Manually trigger background jobs
 */

import { NextRequest, NextResponse } from 'next/server'
import { queueMatchGeneration, queueBatchMatchGeneration } from '@/lib/jobs/match-generation'
import { queueBatchNotification, queueDigestNotification } from '@/lib/jobs/notification-scheduler'
import { queueEventReminderBatch } from '@/lib/jobs/event-reminders'
import { queueCampaignExecution, processActiveCampaigns } from '@/lib/jobs/campaign-executor'
import { queueDataExport } from '@/lib/jobs/data-export'
import { queueAccountDeletion } from '@/lib/jobs/account-deletion'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { jobType, params } = body

    let result: any

    switch (jobType) {
      case 'match-generation':
        if (params.userId) {
          result = await queueMatchGeneration(params.userId, params.priority)
        } else {
          result = await queueBatchMatchGeneration(params)
        }
        break

      case 'notification-batch':
        result = await queueBatchNotification(
          params.userIds,
          params.notification,
          params.batchSize
        )
        break

      case 'notification-digest':
        result = await queueDigestNotification(params.userId, params.digestType)
        break

      case 'event-reminders':
        result = await queueEventReminderBatch(params.reminderType)
        break

      case 'campaign-execution':
        if (params.campaignId) {
          result = await queueCampaignExecution(params.campaignId, params.delay)
        } else {
          const count = await processActiveCampaigns()
          result = { queued: count }
        }
        break

      case 'data-export':
        result = await queueDataExport(params.userId, params.format)
        break

      case 'account-deletion':
        result = await queueAccountDeletion(
          params.userId,
          params.reason,
          params.scheduledFor ? new Date(params.scheduledFor) : undefined
        )
        break

      default:
        return NextResponse.json(
          { error: 'Invalid job type' },
          { status: 400 }
        )
    }

    return NextResponse.json({
      success: true,
      jobType,
      jobId: result.id,
      result,
    })
  } catch (error) {
    console.error('[api/jobs/trigger] Error:', error)
    return NextResponse.json(
      { error: 'Failed to trigger job' },
      { status: 500 }
    )
  }
}
