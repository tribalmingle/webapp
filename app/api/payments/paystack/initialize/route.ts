import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getCurrentUser } from '@/lib/auth'
import { createPaystackCharge } from '@/lib/services/payment-service'

const schema = z.object({
  amountCents: z.number().int().positive(),
  currency: z.string().min(3).max(3),
  purpose: z.enum(['subscription', 'coins', 'gift', 'boost']),
  email: z.string().email(),
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

  const paystackKey = process.env.PAYSTACK_SECRET_KEY
  if (!paystackKey) {
    // Fallback stub if key missing
    const stub = await createPaystackCharge({
      userId: user.userId,
      amountCents: parsed.data.amountCents,
      currency: parsed.data.currency,
      purpose: parsed.data.purpose,
      email: parsed.data.email,
      metadata: parsed.data.metadata,
    })
    return NextResponse.json({ success: true, charge: stub, mode: 'stub' })
  }

  // Real initialize call
  try {
    const initResp = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${paystackKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: parsed.data.email,
        amount: parsed.data.amountCents, // Paystack expects amount in kobo for NGN; adjust per currency later
        metadata: { purpose: parsed.data.purpose, userId: user.userId, ...(parsed.data.metadata || {}) },
        currency: parsed.data.currency.toUpperCase(),
      }),
    })
    const json = await initResp.json()
    if (!initResp.ok || !json.status) {
      return NextResponse.json({ success: false, error: json.message || 'Paystack init failed' }, { status: 502 })
    }
    return NextResponse.json({ success: true, charge: { reference: json.data.reference, authorizationUrl: json.data.authorization_url }, mode: 'live' })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Paystack error'
    return NextResponse.json({ success: false, error: message }, { status: 502 })
  }
}
