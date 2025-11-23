import { NextResponse } from 'next/server'
import { z } from 'zod'
import Stripe from 'stripe'

import { getCurrentUser } from '@/lib/auth'
import { createStripeIntent } from '@/lib/services/payment-service'

const schema = z.object({
  amountCents: z.number().int().positive(),
  currency: z.string().min(3).max(3),
  purpose: z.enum(['subscription', 'coins', 'gift', 'boost']),
  metadata: z.record(z.string()).optional(),
})

export async function POST(request: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 })

  let body: unknown
  try { body = await request.json() } catch { body = {} }
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ success: false, errors: parsed.error.flatten().fieldErrors }, { status: 400 })
  }

  // Placeholder: real implementation will map purpose to product/price IDs.
  const stripeKey = process.env.STRIPE_SECRET_KEY
  if (!stripeKey) {
    // Fallback to stub if key missing
    const intent = await createStripeIntent({
      userId: user.userId,
      amountCents: parsed.data.amountCents,
      currency: parsed.data.currency,
      purpose: parsed.data.purpose,
      metadata: parsed.data.metadata,
    })
    return NextResponse.json({ success: true, intent, mode: 'stub' })
  }

  const stripe = new Stripe(stripeKey, { apiVersion: '2024-06-20' })
  try {
    const pi = await stripe.paymentIntents.create({
      amount: parsed.data.amountCents,
      currency: parsed.data.currency.toLowerCase(),
      metadata: { purpose: parsed.data.purpose, userId: user.userId, ...(parsed.data.metadata || {}) },
      automatic_payment_methods: { enabled: true },
    })
    return NextResponse.json({ success: true, intent: { id: pi.id, clientSecret: pi.client_secret, gateway: 'stripe', amountCents: pi.amount, currency: pi.currency.toUpperCase(), purpose: parsed.data.purpose, createdAt: new Date(), userId: user.userId }, mode: 'live' })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Stripe error'
    return NextResponse.json({ success: false, error: message }, { status: 502 })
  }
}
