import { NextResponse } from 'next/server'

import { getAuthUser } from '@/lib/auth/session'
import { getMongoDb } from '@/lib/mongodb'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const authUser = await getAuthUser(request as any)
  if (!authUser?.userId) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const db = await getMongoDb()
  const now = new Date()
  const endsAt = new Date(now.getTime() + 60 * 60 * 1000)

  // Record a simple boost session document
  await db.collection('boost_sessions').insertOne({
    userId: authUser.userId,
    status: 'active',
    startedAt: now,
    endsAt,
    createdAt: now,
    updatedAt: now,
    viewsGained: 0,
  })

  return NextResponse.json({
    active: true,
    minutesRemaining: 60,
    viewsGained: 0,
    expiresAt: endsAt.toISOString(),
  })
}
