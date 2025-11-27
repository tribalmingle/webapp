/**
 * Event Reminders Background Jobs
 * Sends automated reminders for upcoming events
 */

import { Worker, Job } from 'bullmq'
import { getQueue, redisConnection, QueueNames } from './queue-setup'
import { sendNotification } from '@/lib/services/notification-service'
import { getDb } from '@/lib/db/mongodb'
import { CollectionNames } from '@/lib/data/collection-names'
import { ObjectId } from 'mongodb'

// Job data types
export interface EventReminderJobData {
  eventId: string
  reminderType: '24h' | '1h' | 'starting'
}

export interface EventReminderBatchJobData {
  reminderType: '24h' | '1h' | 'starting'
}

/**
 * Process event reminder job
 */
async function processEventReminder(job: Job<EventReminderJobData>) {
  const { eventId, reminderType } = job.data

  console.log(`[event-reminder] Processing ${reminderType} reminder for event ${eventId}`, {
    jobId: job.id,
  })

  const db = await getDb()
  const eventObjectId = new ObjectId(eventId)

  // Get event details
  const event = await db
    .collection(CollectionNames.COMMUNITY_EVENTS)
    .findOne({ _id: eventObjectId })

  if (!event) {
    throw new Error(`Event not found: ${eventId}`)
  }

  // Check if event is still happening
  if (event.status === 'cancelled') {
    console.log(`[event-reminder] Event ${eventId} is cancelled, skipping reminder`)
    return { skipped: true, reason: 'cancelled' }
  }

  // Get all RSVPs for this event
  const rsvps = await db
    .collection(CollectionNames.EVENT_RSVPS)
    .find({
      event_id: eventObjectId,
      status: 'going',
    })
    .toArray()

  if (rsvps.length === 0) {
    console.log(`[event-reminder] No RSVPs for event ${eventId}`)
    return { sent: 0, reason: 'no_rsvps' }
  }

  // Build reminder message based on type
  let title: string
  let body: string

  switch (reminderType) {
    case '24h':
      title = 'Event Tomorrow!'
      body = `${event.title} starts tomorrow at ${formatTime(event.start_time)}`
      break
    case '1h':
      title = 'Event Starting Soon!'
      body = `${event.title} starts in 1 hour at ${formatTime(event.start_time)}`
      break
    case 'starting':
      title = 'Event Starting Now!'
      body = `${event.title} is starting now at ${event.location?.name || 'the venue'}`
      break
  }

  // Send notifications to all attendees
  let sent = 0
  let failed = 0

  const notificationPromises = rsvps.map(async (rsvp) => {
    try {
      await sendNotification({
        userId: rsvp.user_id.toString(),
        title,
        body,
        category: 'event',
        data: {
          type: 'event_reminder',
          eventId,
          reminderType,
          eventTitle: event.title,
          eventStartTime: event.start_time.toISOString(),
          eventLocation: event.location,
        },
        channels: ['push', 'in_app'],
      })
      sent++
    } catch (error) {
      console.error(`[event-reminder] Failed to send to user ${rsvp.user_id}`, {
        error,
      })
      failed++
    }
  })

  await Promise.allSettled(notificationPromises)

  console.log(`[event-reminder] Reminders sent for event ${eventId}`, {
    jobId: job.id,
    reminderType,
    sent,
    failed,
    total: rsvps.length,
  })

  // Track that reminder was sent
  await db.collection(CollectionNames.COMMUNITY_EVENTS).updateOne(
    { _id: eventObjectId },
    {
      $set: {
        [`reminders_sent.${reminderType}`]: new Date(),
      },
    }
  )

  return { sent, failed, total: rsvps.length }
}

/**
 * Process event reminder batch job
 * Scans all upcoming events and schedules reminders
 */
async function processEventReminderBatch(job: Job<EventReminderBatchJobData>) {
  const { reminderType } = job.data

  console.log(`[event-reminder] Processing ${reminderType} reminder batch`, {
    jobId: job.id,
  })

  const db = await getDb()
  const now = new Date()

  // Calculate time window based on reminder type
  let startTime: Date
  let endTime: Date

  switch (reminderType) {
    case '24h':
      startTime = new Date(now.getTime() + 23.5 * 60 * 60 * 1000) // 23.5 hours from now
      endTime = new Date(now.getTime() + 24.5 * 60 * 60 * 1000) // 24.5 hours from now
      break
    case '1h':
      startTime = new Date(now.getTime() + 0.5 * 60 * 60 * 1000) // 30 minutes from now
      endTime = new Date(now.getTime() + 1.5 * 60 * 60 * 1000) // 1.5 hours from now
      break
    case 'starting':
      startTime = new Date(now.getTime() - 5 * 60 * 1000) // 5 minutes ago
      endTime = new Date(now.getTime() + 5 * 60 * 1000) // 5 minutes from now
      break
  }

  // Find events in this time window that haven't had this reminder sent
  const events = await db
    .collection(CollectionNames.COMMUNITY_EVENTS)
    .find({
      start_time: { $gte: startTime, $lte: endTime },
      status: { $ne: 'cancelled' },
      [`reminders_sent.${reminderType}`]: { $exists: false },
    })
    .toArray()

  console.log(`[event-reminder] Found ${events.length} events needing ${reminderType} reminder`)

  if (events.length === 0) {
    return { processed: 0 }
  }

  // Queue individual reminder jobs for each event
  const queue = getQueue(QueueNames.EVENT_REMINDERS)
  let queued = 0

  for (const event of events) {
    try {
      await queue.add(
        'reminder',
        {
          eventId: event._id.toString(),
          reminderType,
        },
        {
          jobId: `event-reminder-${event._id}-${reminderType}`,
        }
      )
      queued++
    } catch (error) {
      console.error(`[event-reminder] Failed to queue reminder for event ${event._id}`, {
        error,
      })
    }
  }

  console.log(`[event-reminder] Batch complete`, {
    jobId: job.id,
    reminderType,
    queued,
    total: events.length,
  })

  return { processed: events.length, queued }
}

/**
 * Helper to format time for display
 */
function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

/**
 * Create event reminders worker
 */
export function createEventRemindersWorker() {
  const worker = new Worker(
    QueueNames.EVENT_REMINDERS,
    async (job) => {
      if (job.name === 'batch') {
        return processEventReminderBatch(job)
      } else {
        return processEventReminder(job)
      }
    },
    {
      connection: redisConnection,
      concurrency: 5, // Process 5 reminders in parallel
      limiter: {
        max: 200, // Max 200 reminders
        duration: 60000, // per minute
      },
    }
  )

  worker.on('ready', () => {
    console.log('[event-reminder] Worker ready')
  })

  worker.on('completed', (job) => {
    console.log('[event-reminder] Job completed', { jobId: job.id })
  })

  worker.on('failed', (job, error) => {
    console.error('[event-reminder] Job failed', { jobId: job?.id, error })
  })

  return worker
}

/**
 * Queue an event reminder
 */
export async function queueEventReminder(
  eventId: string,
  reminderType: '24h' | '1h' | 'starting',
  delay = 0
) {
  const queue = getQueue(QueueNames.EVENT_REMINDERS)

  const job = await queue.add(
    'reminder',
    { eventId, reminderType },
    {
      delay,
      jobId: `event-reminder-${eventId}-${reminderType}`,
    }
  )

  console.log(`[event-reminder] Queued ${reminderType} reminder for event ${eventId}`, {
    jobId: job.id,
  })

  return job
}

/**
 * Schedule event reminder batch job
 */
export async function queueEventReminderBatch(reminderType: '24h' | '1h' | 'starting') {
  const queue = getQueue(QueueNames.EVENT_REMINDERS)

  const job = await queue.add(
    'batch',
    { reminderType },
    {
      jobId: `event-reminder-batch-${reminderType}-${Date.now()}`,
    }
  )

  console.log(`[event-reminder] Queued ${reminderType} reminder batch`, {
    jobId: job.id,
  })

  return job
}

/**
 * Schedule recurring event reminder batches
 * Call this on app startup to set up cron jobs
 */
export async function scheduleEventReminderCrons() {
  const queue = getQueue(QueueNames.EVENT_REMINDERS)

  // 24-hour reminders (runs every hour)
  await queue.add(
    'batch',
    { reminderType: '24h' },
    {
      repeat: {
        pattern: '0 * * * *', // Every hour
      },
      jobId: 'event-reminder-24h-cron',
    }
  )

  // 1-hour reminders (runs every 15 minutes)
  await queue.add(
    'batch',
    { reminderType: '1h' },
    {
      repeat: {
        pattern: '*/15 * * * *', // Every 15 minutes
      },
      jobId: 'event-reminder-1h-cron',
    }
  )

  // Starting now reminders (runs every 5 minutes)
  await queue.add(
    'batch',
    { reminderType: 'starting' },
    {
      repeat: {
        pattern: '*/5 * * * *', // Every 5 minutes
      },
      jobId: 'event-reminder-starting-cron',
    }
  )

  console.log('[event-reminder] Scheduled all cron jobs')
}

