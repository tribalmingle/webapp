import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getCurrentUser } from '@/lib/auth'
import { activateSubscription } from '@/lib/services/subscription-service'

const schema = z.object({ plan: z.enum(['concierge','guardian','premium_plus']) })

export async function POST(req: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 })
  let body: unknown
  try { body = await req.json() } catch { body = {} }
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ success: false, errors: parsed.error.flatten().fieldErrors }, { status: 400 })
  }
  const rec = await activateSubscription(user.userId, parsed.data.plan)
  return NextResponse.json({ success: true, subscription: rec })
}
