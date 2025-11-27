/**
 * BullMQ Queue Setup
 * Centralized queue configuration and management
 */

import { Queue, QueueEvents, ConnectionOptions } from 'bullmq'
import Redis from 'ioredis'

const REDIS_HOST = process.env.REDIS_HOST || 'localhost'
const REDIS_PORT = parseInt(process.env.REDIS_PORT || '6379')
const REDIS_PASSWORD = process.env.REDIS_PASSWORD
const REDIS_DB = parseInt(process.env.REDIS_DB || '0')

// Redis connection configuration
export const redisConnection: ConnectionOptions = {
  host: REDIS_HOST,
  port: REDIS_PORT,
  password: REDIS_PASSWORD,
  db: REDIS_DB,
  maxRetriesPerRequest: null, // Required for BullMQ
  enableReadyCheck: false,
}

// Queue names
export const QueueNames = {
  MATCH_GENERATION: 'match-generation',
  NOTIFICATIONS: 'notifications',
  EVENT_REMINDERS: 'event-reminders',
  CAMPAIGNS: 'campaigns',
  DATA_EXPORT: 'data-export',
  ACCOUNT_DELETION: 'account-deletion',
  ANALYTICS_PROCESSING: 'analytics-processing',
  MEDIA_PROCESSING: 'media-processing',
} as const

export type QueueName = (typeof QueueNames)[keyof typeof QueueNames]

// Queue instances (singleton pattern)
const queues = new Map<QueueName, Queue>()
const queueEvents = new Map<QueueName, QueueEvents>()

/**
 * Get or create a queue instance
 */
export function getQueue(name: QueueName): Queue {
  if (!queues.has(name)) {
    const queue = new Queue(name, {
      connection: redisConnection,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: {
          count: 100, // Keep last 100 completed jobs
          age: 86400, // 24 hours
        },
        removeOnFail: {
          count: 500, // Keep last 500 failed jobs for debugging
        },
      },
    })

    queues.set(name, queue)

    // Set up queue events for monitoring
    const events = new QueueEvents(name, { connection: redisConnection })
    queueEvents.set(name, events)

    // Log queue events
    events.on('completed', ({ jobId }) => {
      console.log(`[queue:${name}] Job completed`, { jobId })
    })

    events.on('failed', ({ jobId, failedReason }) => {
      console.error(`[queue:${name}] Job failed`, { jobId, failedReason })
    })

    events.on('stalled', ({ jobId }) => {
      console.warn(`[queue:${name}] Job stalled`, { jobId })
    })
  }

  return queues.get(name)!
}

/**
 * Get queue events instance for monitoring
 */
export function getQueueEvents(name: QueueName): QueueEvents {
  if (!queueEvents.has(name)) {
    getQueue(name) // This will create both queue and events
  }
  return queueEvents.get(name)!
}

/**
 * Get all queue instances
 */
export function getAllQueues(): Map<QueueName, Queue> {
  return queues
}

/**
 * Get queue metrics
 */
export async function getQueueMetrics(name: QueueName) {
  const queue = getQueue(name)

  const [waiting, active, completed, failed, delayed] = await Promise.all([
    queue.getWaitingCount(),
    queue.getActiveCount(),
    queue.getCompletedCount(),
    queue.getFailedCount(),
    queue.getDelayedCount(),
  ])

  return {
    name,
    waiting,
    active,
    completed,
    failed,
    delayed,
    total: waiting + active + completed + failed + delayed,
  }
}

/**
 * Get all queue metrics
 */
export async function getAllQueueMetrics() {
  const metrics = await Promise.all(
    Object.values(QueueNames).map((name) => getQueueMetrics(name))
  )

  return metrics
}

/**
 * Pause a queue
 */
export async function pauseQueue(name: QueueName) {
  const queue = getQueue(name)
  await queue.pause()
  console.log(`[queue:${name}] Paused`)
}

/**
 * Resume a queue
 */
export async function resumeQueue(name: QueueName) {
  const queue = getQueue(name)
  await queue.resume()
  console.log(`[queue:${name}] Resumed`)
}

/**
 * Drain a queue (remove all waiting jobs)
 */
export async function drainQueue(name: QueueName) {
  const queue = getQueue(name)
  await queue.drain()
  console.log(`[queue:${name}] Drained`)
}

/**
 * Clean a queue (remove old completed/failed jobs)
 */
export async function cleanQueue(
  name: QueueName,
  options: {
    grace?: number // Grace period in ms
    status?: 'completed' | 'failed'
    limit?: number
  } = {}
) {
  const queue = getQueue(name)
  const cleaned = await queue.clean(
    options.grace || 86400000, // 24 hours default
    options.limit || 1000,
    options.status || 'completed'
  )
  console.log(`[queue:${name}] Cleaned ${cleaned.length} jobs`)
  return cleaned
}

/**
 * Obliterate a queue (delete everything)
 */
export async function obliterateQueue(name: QueueName) {
  const queue = getQueue(name)
  await queue.obliterate()
  console.log(`[queue:${name}] Obliterated`)
}

/**
 * Close all queue connections
 */
export async function closeAllQueues() {
  const closePromises: Promise<void>[] = []

  for (const queue of queues.values()) {
    closePromises.push(queue.close())
  }

  for (const events of queueEvents.values()) {
    closePromises.push(events.close())
  }

  await Promise.all(closePromises)

  queues.clear()
  queueEvents.clear()

  console.log('[queues] All connections closed')
}

/**
 * Health check for queue system
 */
export async function queueHealthCheck(): Promise<{
  healthy: boolean
  redis: boolean
  queues: Record<string, boolean>
}> {
  const result: any = {
    healthy: true,
    redis: false,
    queues: {},
  }

  try {
    // Check Redis connection
    const redis = new Redis({
      host: REDIS_HOST,
      port: REDIS_PORT,
      password: REDIS_PASSWORD,
      db: REDIS_DB,
    })
    await redis.ping()
    await redis.quit()
    result.redis = true
  } catch (error) {
    console.error('[queue-health] Redis check failed', { error })
    result.healthy = false
  }

  // Check each queue
  for (const name of Object.values(QueueNames)) {
    try {
      const queue = getQueue(name)
      await queue.getJobCounts() // Simple health check
      result.queues[name] = true
    } catch (error) {
      console.error(`[queue-health] Queue ${name} check failed`, { error })
      result.queues[name] = false
      result.healthy = false
    }
  }

  return result
}
