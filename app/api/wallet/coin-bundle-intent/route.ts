import { NextResponse } from 'next/server'
import { z } from 'zod'
import Stripe from 'stripe'
import { getCurrentUser } from '@/lib/auth'
import { createStripeIntent } from '@/lib/services/payment-service'

// Static bundle config (could move to DB or config file)
const bundles = [
  { id: 'bundle_small', coins: 100, amountCents: 499 },
  { id: 'bundle_medium', coins: 500, amountCents: 1999 },
  { id: 'bundle_large', coins: 1200, amountCents: 3999 },
]

const schema = z.object({ bundleId: z.enum(['bundle_small','bundle_medium','bundle_large']) })

export async function POST(req: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 })

  let body: unknown; try { body = await req.json() } catch { body = {} }
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ success: false, errors: parsed.error.flatten().fieldErrors }, { status: 400 })

  const bundle = bundles.find(b => b.id === parsed.data.bundleId)!
  const stripeKey = process.env.STRIPE_SECRET_KEY
  if (!stripeKey) {
    // Stub path
    const intent = await createStripeIntent({
      userId: user.userId,
      amountCents: bundle.amountCents,
      currency: 'USD',
      purpose: 'coins',
      metadata: { coins: String(bundle.coins), bundleId: bundle.id },
    })
    return NextResponse.json({ success: true, intent, mode: 'stub' })
  }

  const stripe = new Stripe(stripeKey, { apiVersion: '2024-06-20' })
  try {
    const pi = await stripe.paymentIntents.create({
      amount: bundle.amountCents,
      currency: 'usd',
      metadata: { purpose: 'coins', userId: user.userId, coins: String(bundle.coins), bundleId: bundle.id },
      automatic_payment_methods: { enabled: true },
    })
    return NextResponse.json({ success: true, intent: { id: pi.id, clientSecret: pi.client_secret, gateway: 'stripe', amountCents: pi.amount, currency: pi.currency.toUpperCase(), purpose: 'coins', createdAt: new Date(), userId: user.userId }, mode: 'live' })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || 'coin_bundle_intent_failed' }, { status: 502 })
  }
}
