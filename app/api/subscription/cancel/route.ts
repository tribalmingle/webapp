import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { cancelSubscription } from '@/lib/services/subscription-service'

export async function POST(_req: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 })
  const rec = await cancelSubscription(user.userId)
  if (!rec) return NextResponse.json({ success: false, error: 'No subscription found' }, { status: 404 })
  return NextResponse.json({ success: true, subscription: rec })
}
