import { ObjectId } from 'mongodb'

import type { EventDocument, EventRegistrationDocument } from '@/lib/data/types'
import { getMongoDb } from '@/lib/mongodb'
import { NotificationService, type EventReminderDigestItem, type ReminderWindow } from '@/lib/services/notification-service'

const WINDOW_LEAD_MS: Record<ReminderWindow, number> = {
  '24h': 24 * 60 * 60 * 1000,
  '1h': 60 * 60 * 1000,
}

const WINDOW_WIDTH_MS = Number(process.env.EVENT_REMINDER_WINDOW_MS ?? 60 * 60 * 1000)
const MAX_EVENTS_PER_DIGEST = Number(process.env.EVENT_REMINDER_MAX_EVENTS ?? 3)

async function runWindow(window: ReminderWindow) {
  const digests = await collectDigests(window)
  if (digests.size === 0) {
    console.info(`[event-reminder] ${window} window: nothing to send`)
    return
  }

  for (const [userId, events] of digests) {
    try {
      await NotificationService.sendEventReminder({ userId, reminderWindow: window, events })
      console.info('[event-reminder] sent digest', { userId, window, eventCount: events.length })
    } catch (error) {
      console.error('[event-reminder] failed to send digest', { userId, window, error })
    }
  }
}

async function collectDigests(window: ReminderWindow) {
  const db = await getMongoDb()
  const eventsCollection = db.collection<EventDocument>('events')
  const registrationsCollection = db.collection<EventRegistrationDocument>('event_registrations')

  const now = Date.now()
  const windowStart = new Date(now + WINDOW_LEAD_MS[window])
  const windowEnd = new Date(windowStart.getTime() + WINDOW_WIDTH_MS)

  const events = await eventsCollection
    .find({
      startAt: { $gte: windowStart, $lt: windowEnd },
      moderationState: 'published',
    })
    .project({ slug: 1, title: 1, startAt: 1, timezone: 1, location: 1 })
    .toArray()

  if (!events.length) {
    return new Map<string, EventReminderDigestItem[]>()
  }

  const eventIdMap = new Map(events.map((event) => [event._id!.toHexString(), event]))
  const eventIds = Array.from(eventIdMap.keys()).map((id) => new ObjectId(id))

  const registrations = await registrationsCollection
    .find({
      eventId: { $in: eventIds },
      status: 'confirmed',
      cancelledAt: { $exists: false },
    })
    .project({ userId: 1, eventId: 1 })
    .toArray()

  const digests = new Map<string, EventReminderDigestItem[]>()

  for (const registration of registrations) {
    const event = eventIdMap.get(registration.eventId.toHexString())
    if (!event) continue

      const digestItem: EventReminderDigestItem = {
      id: event._id!.toHexString(),
      slug: event.slug,
      title: event.title,
      startAt: event.startAt.toISOString(),
      timezone: event.timezone,
      locationLabel: formatLocationLabel(event as Pick<EventDocument, 'location'>),
      meetingUrl: event.location?.meetingUrl,
    }

    const userId = registration.userId.toHexString()
    const existing = digests.get(userId) ?? []
    if (existing.length >= MAX_EVENTS_PER_DIGEST) {
      continue
    }
    existing.push(digestItem)
    digests.set(userId, existing)
  }

  return digests
}

function formatLocationLabel(event: Pick<EventDocument, 'location'>) {
  if (!event.location) {
    return undefined
  }

  if (event.location.type === 'virtual') {
    return 'Virtual'
  }

  const parts = [event.location.city, event.location.country].filter(Boolean)
  return parts.length ? parts.join(', ') : undefined
}

async function main() {
  for (const window of Object.keys(WINDOW_LEAD_MS) as ReminderWindow[]) {
    await runWindow(window)
  }
}

main()
  .then(() => {
    console.info('[event-reminder] completed run')
    process.exit(0)
  })
  .catch((error) => {
    console.error('[event-reminder] fatal error', error)
    process.exit(1)
  })
