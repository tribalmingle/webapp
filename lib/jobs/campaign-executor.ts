/**
 * Campaign Executor Background Jobs
 * Executes marketing campaigns and sends targeted notifications
 */

import { Worker, Job } from 'bullmq'
import { getQueue, redisConnection, QueueNames } from './queue-setup'
import { sendNotification } from '@/lib/services/notification-service'
import { getDb } from '@/lib/db/mongodb'
import { CollectionNames } from '@/lib/data/collection-names'
import { ObjectId } from 'mongodb'

// Job data types
export interface CampaignExecutionJobData {
  campaignId: string
}

/**
 * Get target users for a campaign based on segmentation criteria
 */
async function getCampaignTargetUsers(campaign: any) {
  const db = await getDb()

  // Build query based on campaign targeting criteria
  const query: any = {
    deleted_at: { $exists: false },
    status: 'active',
  }

  // Demographics targeting
  if (campaign.targeting?.demographics) {
    const demo = campaign.targeting.demographics

    if (demo.gender && demo.gender !== 'all') {
      query.gender = demo.gender
    }

    if (demo.age_min || demo.age_max) {
      query.birth_date = {}
      if (demo.age_min) {
        const maxDate = new Date()
        maxDate.setFullYear(maxDate.getFullYear() - demo.age_min)
        query.birth_date.$lte = maxDate
      }
      if (demo.age_max) {
        const minDate = new Date()
        minDate.setFullYear(minDate.getFullYear() - demo.age_max)
        query.birth_date.$gte = minDate
      }
    }

    if (demo.tribe_ids?.length) {
      query.tribe_id = { $in: demo.tribe_ids.map((id: string) => new ObjectId(id)) }
    }

    if (demo.locations?.length) {
      query['location.city'] = { $in: demo.locations }
    }
  }

  // Behavioral targeting
  if (campaign.targeting?.behavioral) {
    const behavioral = campaign.targeting.behavioral

    // Account age
    if (behavioral.account_age_min_days) {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - behavioral.account_age_min_days)
      query.created_at = { $lte: cutoffDate }
    }

    if (behavioral.account_age_max_days) {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - behavioral.account_age_max_days)
      if (!query.created_at) query.created_at = {}
      query.created_at.$gte = cutoffDate
    }

    // Last activity
    if (behavioral.last_active_within_days) {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - behavioral.last_active_within_days)
      query.last_active_at = { $gte: cutoffDate }
    }

    // Has made purchase
    if (behavioral.has_purchased !== undefined) {
      if (behavioral.has_purchased) {
        // Users who have purchased
        const purchasedUserIds = await db
          .collection(CollectionNames.TRANSACTIONS)
          .distinct('user_id', {
            status: 'completed',
          })
        query._id = { $in: purchasedUserIds }
      } else {
        // Users who have NOT purchased
        const purchasedUserIds = await db
          .collection(CollectionNames.TRANSACTIONS)
          .distinct('user_id', {
            status: 'completed',
          })
        query._id = { $nin: purchasedUserIds }
      }
    }

    // Has active subscription
    if (behavioral.has_subscription !== undefined) {
      const subscriptionQuery: any = {
        status: 'active',
        current_period_end: { $gt: new Date() },
      }

      const subscribedUserIds = await db
        .collection(CollectionNames.SUBSCRIPTIONS)
        .distinct('user_id', subscriptionQuery)

      if (behavioral.has_subscription) {
        if (query._id) {
          // Combine with existing _id filter
          const existing = Array.isArray(query._id.$in) ? query._id.$in : []
          query._id = {
            $in: existing.filter((id: ObjectId) =>
              subscribedUserIds.some((subId: ObjectId) => subId.equals(id))
            ),
          }
        } else {
          query._id = { $in: subscribedUserIds }
        }
      } else {
        if (query._id && query._id.$nin) {
          query._id.$nin.push(...subscribedUserIds)
        } else {
          query._id = { ...query._id, $nin: subscribedUserIds }
        }
      }
    }
  }

  // Get matching users
  const users = await db
    .collection(CollectionNames.USERS)
    .find(query)
    .project({ _id: 1, email: 1, phone: 1, notification_preferences: 1 })
    .toArray()

  // Filter by notification preferences
  const filteredUsers = users.filter((user: any) => {
    const prefs = user.notification_preferences || {}

    // Check if user has opted out of marketing
    if (prefs.marketing === false) {
      return false
    }

    // Check channel preferences
    if (campaign.channels?.includes('email') && prefs.email === false) {
      return false
    }

    if (campaign.channels?.includes('push') && prefs.push === false) {
      return false
    }

    if (campaign.channels?.includes('sms') && prefs.sms === false) {
      return false
    }

    return true
  })

  return filteredUsers
}

/**
 * Process campaign execution job
 */
async function processCampaignExecution(job: Job<CampaignExecutionJobData>) {
  const { campaignId } = job.data

  console.log(`[campaign-executor] Processing campaign ${campaignId}`, {
    jobId: job.id,
  })

  const db = await getDb()
  const campaignObjectId = new ObjectId(campaignId)

  // Get campaign details
  const campaign = await db
    .collection(CollectionNames.CAMPAIGNS)
    .findOne({ _id: campaignObjectId })

  if (!campaign) {
    throw new Error(`Campaign not found: ${campaignId}`)
  }

  // Check campaign status
  if (campaign.status !== 'active') {
    console.log(`[campaign-executor] Campaign ${campaignId} is not active, skipping`)
    return { skipped: true, reason: 'not_active' }
  }

  // Check if already executed
  if (campaign.last_executed_at) {
    const timeSinceLastExecution =
      Date.now() - campaign.last_executed_at.getTime()
    const minInterval = 3600000 // 1 hour minimum between executions

    if (timeSinceLastExecution < minInterval) {
      console.log(
        `[campaign-executor] Campaign ${campaignId} was recently executed, skipping`
      )
      return { skipped: true, reason: 'recently_executed' }
    }
  }

  // Get target users
  const targetUsers = await getCampaignTargetUsers(campaign)

  console.log(`[campaign-executor] Found ${targetUsers.length} target users for campaign ${campaignId}`)

  if (targetUsers.length === 0) {
    // Update campaign stats
    await db.collection(CollectionNames.CAMPAIGNS).updateOne(
      { _id: campaignObjectId },
      {
        $set: {
          last_executed_at: new Date(),
        },
      }
    )

    return { sent: 0, reason: 'no_target_users' }
  }

  // Send notifications
  let sent = 0
  let failed = 0
  const batchSize = 100

  for (let i = 0; i < targetUsers.length; i += batchSize) {
    const batch = targetUsers.slice(i, i + batchSize)

    const promises = batch.map(async (user) => {
      try {
        await sendNotification({
          userId: user._id.toString(),
          title: campaign.title,
          body: campaign.message,
          category: 'growth',
          data: {
            type: 'campaign',
            campaignId,
            campaignType: campaign.campaign_type,
            ...campaign.data,
          },
          channels: campaign.channels || ['push', 'in_app'],
        })
        sent++
      } catch (error) {
        console.error(`[campaign-executor] Failed to send to user ${user._id}`, {
          error,
        })
        failed++
      }
    })

    await Promise.allSettled(promises)

    // Update progress
    await job.updateProgress(
      Math.floor(((i + batch.length) / targetUsers.length) * 100)
    )

    // Small delay between batches
    if (i + batchSize < targetUsers.length) {
      await new Promise((resolve) => setTimeout(resolve, 500))
    }
  }

  // Update campaign stats
  await db.collection(CollectionNames.CAMPAIGNS).updateOne(
    { _id: campaignObjectId },
    {
      $set: {
        last_executed_at: new Date(),
        'stats.sent': (campaign.stats?.sent || 0) + sent,
        'stats.failed': (campaign.stats?.failed || 0) + failed,
        'stats.executions': (campaign.stats?.executions || 0) + 1,
      },
    }
  )

  console.log(`[campaign-executor] Campaign ${campaignId} execution complete`, {
    jobId: job.id,
    sent,
    failed,
    total: targetUsers.length,
  })

  return { sent, failed, total: targetUsers.length }
}

/**
 * Create campaign executor worker
 */
export function createCampaignExecutorWorker() {
  const worker = new Worker(
    QueueNames.CAMPAIGNS,
    async (job) => {
      return processCampaignExecution(job)
    },
    {
      connection: redisConnection,
      concurrency: 2, // Process 2 campaigns in parallel
      limiter: {
        max: 50, // Max 50 jobs
        duration: 60000, // per minute
      },
    }
  )

  worker.on('ready', () => {
    console.log('[campaign-executor] Worker ready')
  })

  worker.on('completed', (job) => {
    console.log('[campaign-executor] Job completed', { jobId: job.id })
  })

  worker.on('failed', (job, error) => {
    console.error('[campaign-executor] Job failed', { jobId: job?.id, error })
  })

  return worker
}

/**
 * Queue a campaign for execution
 */
export async function queueCampaignExecution(campaignId: string, delay = 0) {
  const queue = getQueue(QueueNames.CAMPAIGNS)

  const job = await queue.add(
    'execute',
    { campaignId },
    {
      delay,
      jobId: `campaign-${campaignId}-${Date.now()}`,
    }
  )

  console.log(`[campaign-executor] Queued campaign ${campaignId}`, {
    jobId: job.id,
  })

  return job
}

/**
 * Schedule a recurring campaign
 */
export async function scheduleCampaign(
  campaignId: string,
  cronPattern: string
) {
  const queue = getQueue(QueueNames.CAMPAIGNS)

  const job = await queue.add(
    'execute',
    { campaignId },
    {
      repeat: {
        pattern: cronPattern,
      },
      jobId: `campaign-${campaignId}-recurring`,
    }
  )

  console.log(`[campaign-executor] Scheduled campaign ${campaignId}`, {
    jobId: job.id,
    cronPattern,
  })

  return job
}

/**
 * Process all active campaigns that need execution
 */
export async function processActiveCampaigns() {
  const db = await getDb()

  const activeCampaigns = await db
    .collection(CollectionNames.CAMPAIGNS)
    .find({
      status: 'active',
      scheduled_for: { $lte: new Date() },
    })
    .toArray()

  console.log(`[campaign-executor] Found ${activeCampaigns.length} active campaigns`)

  for (const campaign of activeCampaigns) {
    await queueCampaignExecution(campaign._id.toString())
  }

  return activeCampaigns.length
}

/**
 * Schedule daily campaign processing
 */
export async function scheduleDailyCampaignProcessing() {
  const queue = getQueue(QueueNames.CAMPAIGNS)

  // Run every 6 hours to check for active campaigns
  await queue.add(
    'process-active',
    {},
    {
      repeat: {
        pattern: '0 */6 * * *', // Every 6 hours
      },
      jobId: 'campaign-processing-cron',
    }
  )

  console.log('[campaign-executor] Scheduled daily campaign processing')
}

