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

// Phase 5: Chat notification types
export type VoiceNoteNotificationParams = {
  userId: string
  senderName: string
  senderPhoto?: string
  duration: number
  messageId: string
}

export type LiveKitInviteParams = {
  userId: string
  inviterName: string
  inviterPhoto?: string
  roomName: string
  roomUrl: string
}

export type SafetyAlertParams = {
  userId: string
  alertType: 'suspicious_behavior' | 'content_flagged' | 'account_warning'
  message: string
  actionUrl?: string
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

  /**
   * Phase 5: Send voice note notification
   */
  static async sendVoiceNoteNotification(params: VoiceNoteNotificationParams) {
    return withSpan('notification.voiceNote', async () => {
      const db = await getMongoDb()
      const notifications = db.collection<NotificationDocument>('notifications')
      
      const now = new Date()
      const heading = `🎤 Voice note from ${params.senderName}`
      const body = `${params.senderName} sent you a ${params.duration}s voice message`
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.tribalmingle.com'
      const deepLinkUrl = `${baseUrl}/chat/${params.userId}?message=${params.messageId}`

      const doc: NotificationDocument = {
        userId: new ObjectId(params.userId),
        category: 'message',
        type: 'voice_note_received',
        channel: 'push',
        templateId: 'voice_note_v1',
        payload: {
          heading,
          body,
          deeplink: deepLinkUrl,
          senderName: params.senderName,
          senderPhoto: params.senderPhoto,
          duration: params.duration,
        },
        status: 'pending',
        priority: 'normal',
        createdAt: now,
        updatedAt: now,
      }

      const { insertedId } = await notifications.insertOne(doc as any)

      try {
        await sendOneSignalNotification({
          heading,
          content: body,
          userIds: [params.userId],
          url: deepLinkUrl,
          icon: params.senderPhoto,
        })

        await notifications.updateOne(
          { _id: insertedId },
          {
            $set: {
              status: 'sent',
              sentAt: new Date(),
              updatedAt: new Date(),
            },
          }
        )
      } catch (error) {
        await notifications.updateOne(
          { _id: insertedId },
          {
            $set: {
              status: 'failed',
              updatedAt: new Date(),
            },
          }
        )
      }

      await AnalyticsService.track({
        eventType: 'notifications.voice_note.sent',
        userId: params.userId,
        properties: {
          senderName: params.senderName,
          duration: params.duration,
        },
      })

      return { ...doc, _id: insertedId }
    }, { userId: params.userId })
  }

  /**
   * Phase 5: Send LiveKit video invite notification
   */
  static async sendLiveKitInvite(params: LiveKitInviteParams) {
    return withSpan('notification.liveKitInvite', async () => {
      const db = await getMongoDb()
      const notifications = db.collection<NotificationDocument>('notifications')
      
      const now = new Date()
      const heading = `📹 Video call from ${params.inviterName}`
      const body = `${params.inviterName} is inviting you to a video call`

      const doc: NotificationDocument = {
        userId: new ObjectId(params.userId),
        category: 'call',
        type: 'livekit_invite',
        channel: 'push',
        templateId: 'livekit_invite_v1',
        payload: {
          heading,
          body,
          deeplink: params.roomUrl,
          inviterName: params.inviterName,
          inviterPhoto: params.inviterPhoto,
          roomName: params.roomName,
        },
        status: 'pending',
        priority: 'high', // Video calls are urgent
        createdAt: now,
        updatedAt: now,
      }

      const { insertedId } = await notifications.insertOne(doc as any)

      try {
        await sendOneSignalNotification({
          heading,
          content: body,
          userIds: [params.userId],
          url: params.roomUrl,
          icon: params.inviterPhoto,
          ttlSeconds: 300, // 5 minutes for call invites
        })

        await notifications.updateOne(
          { _id: insertedId },
          {
            $set: {
              status: 'sent',
              sentAt: new Date(),
              updatedAt: new Date(),
            },
          }
        )
      } catch (error) {
        await notifications.updateOne(
          { _id: insertedId },
          {
            $set: {
              status: 'failed',
              updatedAt: new Date(),
            },
          }
        )
      }

      await AnalyticsService.track({
        eventType: 'notifications.livekit_invite.sent',
        userId: params.userId,
        properties: {
          inviterName: params.inviterName,
          roomName: params.roomName,
        },
      })

      return { ...doc, _id: insertedId }
    }, { userId: params.userId })
  }

  /**
   * Phase 5: Send safety alert notification
   */
  static async sendSafetyAlert(params: SafetyAlertParams) {
    return withSpan('notification.safetyAlert', async () => {
      const db = await getMongoDb()
      const notifications = db.collection<NotificationDocument>('notifications')
      
      const now = new Date()
      const heading = '🛡️ Safety Alert'
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.tribalmingle.com'
      const deepLinkUrl = params.actionUrl || `${baseUrl}/safety`

      const doc: NotificationDocument = {
        userId: new ObjectId(params.userId),
        category: 'safety',
        type: 'safety_alert',
        channel: 'push',
        templateId: 'safety_alert_v1',
        payload: {
          heading,
          body: params.message,
          deeplink: deepLinkUrl,
          alertType: params.alertType,
        },
        status: 'pending',
        priority: 'high',
        createdAt: now,
        updatedAt: now,
      }

      const { insertedId } = await notifications.insertOne(doc as any)

      try {
        await sendOneSignalNotification({
          heading,
          content: params.message,
          userIds: [params.userId],
          url: deepLinkUrl,
        })

        await notifications.updateOne(
          { _id: insertedId },
          {
            $set: {
              status: 'sent',
              sentAt: new Date(),
              updatedAt: new Date(),
            },
          }
        )
      } catch (error) {
        await notifications.updateOne(
          { _id: insertedId },
          {
            $set: {
              status: 'failed',
              updatedAt: new Date(),
            },
          }
        )
      }

      await AnalyticsService.track({
        eventType: 'notifications.safety_alert.sent',
        userId: params.userId,
        properties: {
          alertType: params.alertType,
        },
      })

      return { ...doc, _id: insertedId }
    }, { userId: params.userId, alertType: params.alertType })
  }
}

/**
 * Generic notification payload for background jobs
 */
export type NotificationPayload = {
  userId: string
  title: string
  body: string
  category: 'growth' | 'match' | 'event' | 'safety' | 'billing' | 'message' | 'call'
  data?: Record<string, any>
  channels?: ('push' | 'email' | 'sms' | 'in_app')[]
}

/**
 * Send a generic notification (for background jobs)
 */
export async function sendNotification(payload: NotificationPayload) {
  const db = await getMongoDb()
  const notifications = db.collection<NotificationDocument>('notifications')

  const now = new Date()

  const doc: NotificationDocument = {
    userId: new ObjectId(payload.userId),
    category: payload.category,
    type: 'generic',
    channel: 'push',
    templateId: 'generic_v1',
    payload: {
      heading: payload.title,
      body: payload.body,
      ...payload.data,
    },
    status: 'pending',
    priority: 'normal',
    createdAt: now,
    updatedAt: now,
  }

  const { insertedId } = await notifications.insertOne(doc as any)

  // Send via OneSignal if push is enabled
  if (payload.channels?.includes('push')) {
    try {
      await sendOneSignalNotification({
        heading: payload.title,
        content: payload.body,
        userIds: [payload.userId],
      })

      await notifications.updateOne(
        { _id: insertedId },
        {
          $set: {
            status: 'sent',
            sentAt: new Date(),
            updatedAt: new Date(),
          },
        }
      )
    } catch (error) {
      await notifications.updateOne(
        { _id: insertedId },
        {
          $set: {
            status: 'failed',
            updatedAt: new Date(),
          },
        }
      )
    }
  }

  return { ...doc, _id: insertedId }
}
