/**
 * Twilio Webhook Handler
 * Processes delivery receipts and status updates from Twilio
 */

import { NextRequest, NextResponse } from 'next/server'
import { getMongoDb } from '@/lib/mongodb'
import { validateWebhookSignature } from '@/lib/vendors/twilio-client'
import { AnalyticsService } from '@/lib/services/analytics-service'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const url = request.url
    const signature = request.headers.get('x-twilio-signature')

    if (!signature) {
      console.warn('[twilio-webhook] Missing signature')
      return NextResponse.json({ error: 'Missing signature' }, { status: 401 })
    }

    // Parse form data (Twilio sends application/x-www-form-urlencoded)
    const formData = await request.formData()
    const body: Record<string, unknown> = {}
    formData.forEach((value, key) => {
      body[key] = value
    })

    // Validate webhook signature
    const isValid = validateWebhookSignature({ signature, url, body })
    if (!isValid) {
      console.warn('[twilio-webhook] Invalid signature')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const messageSid = body.MessageSid as string
    const messageStatus = body.MessageStatus as string
    const errorCode = body.ErrorCode as string | undefined
    const errorMessage = body.ErrorMessage as string | undefined

    console.log('[twilio-webhook] Received status update', {
      messageSid,
      messageStatus,
      errorCode,
    })

    // Update notification document
    if (messageSid) {
      const db = await getMongoDb()
      const notifications = db.collection('notifications')

      const updateDoc: any = {
        updatedAt: new Date(),
      }

      if (messageStatus === 'delivered') {
        updateDoc.status = 'sent'
        updateDoc.sentAt = new Date()
      } else if (messageStatus === 'failed' || messageStatus === 'undelivered') {
        updateDoc.status = 'failed'
        updateDoc.deliveryResponse = {
          errorCode,
          errorMessage,
          twilioStatus: messageStatus,
        }
      }

      await notifications.updateOne(
        { 'deliveryResponse.twilioSid': messageSid },
        { $set: updateDoc }
      )
    }

    // Track analytics
    await AnalyticsService.track({
      eventType: `twilio.webhook.${messageStatus}`,
      properties: {
        messageSid,
        errorCode,
      },
    })

    // Return TwiML response (Twilio expects 200 OK)
    return new NextResponse('<?xml version="1.0" encoding="UTF-8"?><Response></Response>', {
      status: 200,
      headers: {
        'Content-Type': 'text/xml',
      },
    })
  } catch (error) {
    console.error('[twilio-webhook] Error processing webhook', { error })
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Webhook processing failed' },
      { status: 500 }
    )
  }
}
