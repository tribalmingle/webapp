import { NextRequest, NextResponse } from 'next/server'

import { getAuthUser } from '@/lib/auth/session'
import { getMongoDb } from '@/lib/mongodb'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const authUser = await getAuthUser(request)
  if (!authUser?.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json().catch(() => ({} as any))
  const paused = Boolean(body?.paused)
  const reason = typeof body?.reason === 'string' ? body.reason : undefined

  const db = await getMongoDb()
  await db.collection('user_settings').updateOne(
    { userId: authUser.userId },
    { $set: { paused, pauseReason: reason ?? null, updatedAt: new Date(), userId: authUser.userId } },
    { upsert: true },
  )

  return NextResponse.json({ message: 'Account pause state updated', paused })
}
