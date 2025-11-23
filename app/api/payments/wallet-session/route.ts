import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getCurrentUser } from '@/lib/auth'
import { initiateApplePaySession, initiateGooglePaySession } from '@/lib/services/payment-service'

const schema = z.object({
  provider: z.enum(['apple_pay', 'google_pay']),
  amountCents: z.number().int().positive(),
  currency: z.string().min(3).max(3),
  purpose: z.enum(['subscription', 'coins', 'gift', 'boost']),
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

  const { provider, amountCents, currency, purpose } = parsed.data
  const session = provider === 'apple_pay'
    ? await initiateApplePaySession({ userId: user.userId, amountCents, currency, purpose })
    : await initiateGooglePaySession({ userId: user.userId, amountCents, currency, purpose })

  return NextResponse.json({ success: true, session })
}
