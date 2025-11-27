/**
 * LiveKit Webhook Handler
 * Processes room events and participant updates from LiveKit
 */

import { NextRequest, NextResponse } from 'next/server'
import { WebhookReceiver } from 'livekit-server-sdk'
import { getMongoDb } from '@/lib/mongodb'
import { AnalyticsService } from '@/lib/services/analytics-service'

const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    if (!LIVEKIT_API_KEY || !LIVEKIT_API_SECRET) {
      console.warn('[livekit-webhook] Missing credentials')
      return NextResponse.json({ error: 'Configuration error' }, { status: 500 })
    }

    const body = await request.text()
    const authHeader = request.headers.get('authorization')

    const receiver = new WebhookReceiver(LIVEKIT_API_KEY, LIVEKIT_API_SECRET)
    const event = await receiver.receive(body, authHeader || '')

    console.log('[livekit-webhook] Received event', {
      event: event.event,
      room: event.room?.name,
    })

    const db = await getMongoDb()

    // Handle different event types
    switch (event.event) {
      case 'room_started':
        if (event.room) {
          // Update chat or event record with room started
          await AnalyticsService.track({
            eventType: 'livekit.room.started',
            properties: {
              roomName: event.room.name,
              roomSid: event.room.sid,
              createdAt: event.room.creationTime,
            },
          })
        }
        break

      case 'room_finished':
        if (event.room) {
          // Update chat or event record with room ended, duration
          const duration = (event.room as any).duration || 0

          await AnalyticsService.track({
            eventType: 'livekit.room.finished',
            properties: {
              roomName: event.room.name,
              roomSid: event.room.sid,
              duration,
              numParticipants: event.room.numParticipants,
            },
          })

          // Update chat messages or event records
          const chatMessages = db.collection('chat_messages')
          await chatMessages.updateMany(
            { 'metadata.roomName': event.room.name },
            {
              $set: {
                'metadata.roomEnded': new Date(),
                'metadata.roomDuration': duration,
                updatedAt: new Date(),
              },
            }
          )
        }
        break

      case 'participant_joined':
        if (event.participant) {
          await AnalyticsService.track({
            eventType: 'livekit.participant.joined',
            properties: {
              roomName: event.room?.name,
              participantId: event.participant.identity,
              participantName: event.participant.name,
            },
          })
        }
        break

      case 'participant_left':
        if (event.participant) {
          await AnalyticsService.track({
            eventType: 'livekit.participant.left',
            properties: {
              roomName: event.room?.name,
              participantId: event.participant.identity,
              participantName: event.participant.name,
            },
          })
        }
        break

      case 'egress_started':
      case 'egress_ended':
        // Handle recording events
        if (event.egressInfo) {
          await AnalyticsService.track({
            eventType: `livekit.egress.${event.event === 'egress_started' ? 'started' : 'ended'}`,
            properties: {
              roomName: event.room?.name,
              egressId: event.egressInfo.egressId,
              status: event.egressInfo.status,
            },
          })
        }
        break

      default:
        console.log('[livekit-webhook] Unhandled event type', { event: event.event })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[livekit-webhook] Error processing webhook', { error })
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Webhook processing failed' },
      { status: 500 }
    )
  }
}
