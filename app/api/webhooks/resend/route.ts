import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import clientPromise from '@/lib/mongodb'

/**
 * Resend Webhook Handler
 * Handles email delivery status events from Resend
 * 
 * Webhook URL: https://tribalmingle.com/api/webhooks/resend
 * 
 * Event Types:
 * - email.sent: Email was accepted by the recipient's mail server
 * - email.delivered: Email was successfully delivered
 * - email.delivery_delayed: Delivery was delayed
 * - email.complained: Recipient marked as spam
 * - email.bounced: Email bounced (hard or soft)
 * - email.opened: Recipient opened the email
 * - email.clicked: Recipient clicked a link in the email
 */

interface ResendWebhookPayload {
  type: 'email.sent' | 'email.delivered' | 'email.delivery_delayed' | 'email.complained' | 'email.bounced' | 'email.opened' | 'email.clicked'
  created_at: string
  data: {
    created_at: string
    email_id: string
    from: string
    to: string[]
    subject: string
    // Bounce/complaint specific fields
    bounce_type?: 'hard' | 'soft'
    complaint_feedback_type?: string
    // Click specific fields
    link?: string
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify webhook signature (recommended for production)
    const headersList = await headers()
    const signature = headersList.get('svix-signature')
    const webhookId = headersList.get('svix-id')
    const timestamp = headersList.get('svix-timestamp')

    // Parse webhook payload
    const payload: ResendWebhookPayload = await request.json()

    console.log('[Resend Webhook]', {
      type: payload.type,
      emailId: payload.data.email_id,
      to: payload.data.to,
      subject: payload.data.subject,
    })

    // Store webhook event in database for tracking
    const client = await clientPromise
    const db = client.db(process.env.MONGODB_DB || 'tribalmingle')

    await db.collection('email_events').insertOne({
      type: payload.type,
      emailId: payload.data.email_id,
      from: payload.data.from,
      to: payload.data.to,
      subject: payload.data.subject,
      bounceType: payload.data.bounce_type,
      complaintType: payload.data.complaint_feedback_type,
      link: payload.data.link,
      createdAt: new Date(payload.created_at),
      receivedAt: new Date(),
    })

    // Handle specific event types
    switch (payload.type) {
      case 'email.bounced':
        await handleBounce(db, payload)
        break
      case 'email.complained':
        await handleComplaint(db, payload)
        break
      case 'email.delivered':
        await handleDelivered(db, payload)
        break
      case 'email.opened':
        await handleOpened(db, payload)
        break
      case 'email.clicked':
        await handleClicked(db, payload)
        break
    }

    return NextResponse.json({ received: true }, { status: 200 })
  } catch (error) {
    console.error('[Resend Webhook] Error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

/**
 * Handle bounced emails
 * Hard bounces: mark email as invalid
 * Soft bounces: increment bounce count
 */
async function handleBounce(db: any, payload: ResendWebhookPayload) {
  const email = payload.data.to[0]
  const isHardBounce = payload.data.bounce_type === 'hard'

  console.log(`[Resend] Email bounced (${payload.data.bounce_type}):`, email)

  if (isHardBounce) {
    // Mark email as invalid - prevent future sends
    await db.collection('users').updateOne(
      { email: email.toLowerCase() },
      {
        $set: {
          emailInvalid: true,
          emailBounceReason: 'hard_bounce',
          updatedAt: new Date(),
        },
      }
    )
  } else {
    // Soft bounce - increment counter
    await db.collection('users').updateOne(
      { email: email.toLowerCase() },
      {
        $inc: { emailBounceCount: 1 },
        $set: { updatedAt: new Date() },
      }
    )
  }
}

/**
 * Handle spam complaints
 * Mark user's email preferences
 */
async function handleComplaint(db: any, payload: ResendWebhookPayload) {
  const email = payload.data.to[0]

  console.log('[Resend] Spam complaint from:', email)

  // Mark user as unsubscribed from all emails
  await db.collection('users').updateOne(
    { email: email.toLowerCase() },
    {
      $set: {
        emailUnsubscribed: true,
        emailUnsubscribeReason: 'spam_complaint',
        emailUnsubscribedAt: new Date(),
        updatedAt: new Date(),
      },
    }
  )
}

/**
 * Handle successful delivery
 * Track delivery metrics
 */
async function handleDelivered(db: any, payload: ResendWebhookPayload) {
  const email = payload.data.to[0]

  // Update user's last successful email delivery
  await db.collection('users').updateOne(
    { email: email.toLowerCase() },
    {
      $set: {
        lastEmailDeliveredAt: new Date(payload.created_at),
        updatedAt: new Date(),
      },
    }
  )
}

/**
 * Handle email opens
 * Track engagement metrics
 */
async function handleOpened(db: any, payload: ResendWebhookPayload) {
  const email = payload.data.to[0]

  console.log('[Resend] Email opened:', email, payload.data.subject)

  // Track email opens for engagement metrics
  await db.collection('users').updateOne(
    { email: email.toLowerCase() },
    {
      $inc: { emailOpenCount: 1 },
      $set: {
        lastEmailOpenedAt: new Date(payload.created_at),
        updatedAt: new Date(),
      },
    }
  )
}

/**
 * Handle link clicks
 * Track click engagement
 */
async function handleClicked(db: any, payload: ResendWebhookPayload) {
  const email = payload.data.to[0]

  console.log('[Resend] Link clicked:', email, payload.data.link)

  // Track link clicks for engagement metrics
  await db.collection('users').updateOne(
    { email: email.toLowerCase() },
    {
      $inc: { emailClickCount: 1 },
      $set: {
        lastEmailClickedAt: new Date(payload.created_at),
        updatedAt: new Date(),
      },
    }
  )
}
