import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { verifyAndParseStripeWebhook, handleStripeWebhook, applyEntitlementsForPayment } from '@/lib/services/payment-service'
import { activateSubscription, cancelSubscription, markSubscriptionPastDue } from '@/lib/services/subscription-service'
import { getMongoDb } from '@/lib/mongodb'

// Exportable handler for replay scripts / tests
export async function processStripeEvent(event: Stripe.Event) {
  await handleStripeWebhook({ id: event.id, type: event.type, data: event.data.object as any })
  if (event.type === 'payment_intent.succeeded') {
    try {
      const db = await getMongoDb()
      const obj = event.data.object as Stripe.PaymentIntent
      const providerPaymentId = obj.id
      const payment = await db.collection('payments').findOne({ providerPaymentId })
      if (payment) {
        await db.collection('payments').updateOne({ _id: payment._id }, { $set: { status: 'succeeded', updatedAt: new Date() } })
        const purpose = payment.lineItems?.[0]?.description || obj.metadata?.purpose || 'subscription'
        const userId = payment.userId?.toString() || obj.metadata?.userId
        if (userId) {
          if (purpose === 'coins') {
            const alreadyCredited = payment.metadata?.credited
            if (!alreadyCredited) {
              await applyEntitlementsForPayment(purpose, userId, payment.amount?.valueCents || obj.amount || 0, obj.metadata as any)
              await db.collection('payments').updateOne({ _id: payment._id }, { $set: { 'metadata.credited': true } })
            }
          } else {
            await applyEntitlementsForPayment(purpose, userId, payment.amount?.valueCents || obj.amount || 0, obj.metadata as any)
          }
        }
      }
    } catch {}
  }
  if (event.type.startsWith('customer.subscription.')) {
    try {
      const subObj = event.data.object as Stripe.Subscription
      const userId = (subObj.metadata as any)?.userId
      if (userId) {
        if (event.type === 'customer.subscription.deleted') {
          await cancelSubscription(userId)
        } else {
          const planMap: Record<string, any> = { concierge: 'concierge', guardian: 'guardian', premium_plus: 'premium_plus' }
          const metadataPlan = (subObj.metadata as any)?.plan as string | undefined
          const mappedPlan = metadataPlan && planMap[metadataPlan] ? planMap[metadataPlan] : 'concierge'
          await activateSubscription(userId, mappedPlan)
        }
      }
    } catch {}
  }
  if (event.type === 'invoice.payment_failed') {
    try {
      const invoice = event.data.object as Stripe.Invoice
      const subId = invoice.subscription as string | undefined
      const userId = (invoice.metadata as any)?.userId || (invoice.customer_email ? undefined : (invoice.metadata as any)?.userId)
      if (userId && subId) {
        await markSubscriptionPastDue(userId)
      }
    } catch {}
  }
  return { processed: true }
}

export async function POST(request: Request) {
  // In Next.js App Router, to get raw body you'd normally use a custom config.
  // For scaffold purposes we parse text then convert to Buffer.
  const signature = request.headers.get('stripe-signature') || undefined
  const raw = await request.text()
  const stripeKey = process.env.STRIPE_SECRET_KEY
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (stripeKey && webhookSecret && signature) {
    const stripe = new Stripe(stripeKey, { apiVersion: '2024-06-20' })
    try {
      const event = stripe.webhooks.constructEvent(Buffer.from(raw), signature, webhookSecret)
      await processStripeEvent(event)
      return NextResponse.json({ success: true, event: { id: event.id, type: event.type }, mode: 'live' })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Webhook signature error'
      return NextResponse.json({ success: false, error: message }, { status: 400 })
    }
  }

  // Fallback stub path
  const event = await verifyAndParseStripeWebhook(Buffer.from(raw), signature)
  if (!event) return NextResponse.json({ success: false, error: 'Invalid signature (stub)' }, { status: 400 })
  const result = await handleStripeWebhook(event)
  // Stub success path: if stub event indicates success (placeholder), no entitlement mapping
  return NextResponse.json({ success: true, event: { id: event.id, type: event.type }, result, mode: 'stub' })
}
