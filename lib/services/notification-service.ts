import { ObjectId } from 'mongodb'

import type { NotificationDocument } from '@/lib/data/types'
import { getMongoDb } from '@/lib/mongodb'
import { withSpan } from '@/lib/observability/tracing'
import { AnalyticsService } from './analytics-service'
import { sendOneSignalNotification } from '@/lib/vendors/onesignal-client'

export type ReminderWindow = '24h' | '1h'

export type EventReminderDigestItem = {
  id: string
  slug: string
  title: string
  startAt: string
  timezone?: string
  locationLabel?: string
  meetingUrl?: string
}

type EventReminderParams = {
  userId: string
  reminderWindow: ReminderWindow
  events: EventReminderDigestItem[]
}

type ReminderCopy = {
  heading: string
  body: string
  deepLinkUrl: string
}

export class NotificationService {
  static async sendEventReminder(params: EventReminderParams) {
    if (!params.events.length) {
      throw new Error('events must include at least one entry')
    }

    return withSpan('notification.eventReminder', async () => {
      const db = await getMongoDb()
      const notifications = db.collection<NotificationDocument>('notifications')
      const dedupeKey = this.buildEventReminderDedupeKey(params)
      const existing = await notifications.findOne({ dedupeKey })
      if (existing) {
        return existing
      }

      const now = new Date()
      const copy = this.buildReminderCopy(params)

      const doc: NotificationDocument = {
        userId: new ObjectId(params.userId),
        category: 'event',
        type: 'event_reminder',
        channel: 'push',
        templateId: `event_reminder_${params.reminderWindow}`,
        payload: {
          heading: copy.heading,
          body: copy.body,
          deeplink: copy.deepLinkUrl,
          events: params.events,
          reminderWindow: params.reminderWindow,
        },
        status: 'pending',
        priority: params.reminderWindow === '1h' ? 'high' : 'normal',
        scheduledAt: params.reminderWindow === '24h' ? new Date(params.events[0].startAt) : undefined,
        dedupeKey,
        metadata: {
          reminderWindow: params.reminderWindow,
          eventIds: params.events.map((event) => event.id),
        },
        createdAt: now,
        updatedAt: now,
      }

      const { insertedId } = await notifications.insertOne(doc as any)

      try {
        const result = await sendOneSignalNotification({
          heading: copy.heading,
          content: copy.body,
          userIds: [params.userId],
          url: copy.deepLinkUrl,
          data: {
            reminderWindow: params.reminderWindow,
            events: params.events,
          },
          ttlSeconds: params.reminderWindow === '1h' ? 3600 : 24 * 3600,
          deliveryTag: dedupeKey,
        })

        const deliveryResponse: any = { provider: 'onesignal', status: result.status }
        if (result && typeof result === 'object') {
          if ('id' in result) deliveryResponse.id = (result as any).id
          if ('reason' in result) deliveryResponse.reason = (result as any).reason
        }

        await notifications.updateOne(
          { _id: insertedId },
          {
            $set: {
              status: 'sent',
              sentAt: new Date(),
              updatedAt: new Date(),
              deliveryResponse,
            },
          },
        )
      } catch (error) {
        await notifications.updateOne(
          { _id: insertedId },
          {
            $set: {
              status: 'failed',
              updatedAt: new Date(),
              metadata: {
                ...(doc.metadata ?? {}),
                error: error instanceof Error ? error.message : 'unknown notification error',
              },
            },
          },
        )
        throw error
      }

      await AnalyticsService.track({
        eventType: 'notifications.event_reminder.sent',
        userId: params.userId,
        properties: {
          reminderWindow: params.reminderWindow,
          eventIds: params.events.map((event) => event.id),
        },
      })

      return { ...doc, _id: insertedId }
    }, { userId: params.userId, reminderWindow: params.reminderWindow, eventCount: params.events.length })
  }

  private static buildReminderCopy(params: EventReminderParams): ReminderCopy {
    const primary = params.events[0]
    const extra = params.events.length - 1
    const heading = params.reminderWindow === '24h' ? `Tomorrow's lineup` : `It's almost showtime`
    const body = extra > 0
      ? `${primary.title} + ${extra} more ${params.reminderWindow === '24h' ? 'kick off tomorrow' : 'start soon'}.`
      : `${primary.title} ${params.reminderWindow === '24h' ? 'starts tomorrow' : 'starts shortly'}.`

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.tribalmingle.com'
    const deepLinkUrl = `${baseUrl}/events/${primary.slug}`

    return { heading, body, deepLinkUrl }
  }

  private static buildEventReminderDedupeKey(params: EventReminderParams) {
    const eventKey = params.events.map((event) => event.id).sort().join(',')
    return `event_reminder:${params.reminderWindow}:${params.userId}:${eventKey}`
  }
}
