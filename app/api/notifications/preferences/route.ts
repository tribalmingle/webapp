import { NextRequest, NextResponse } from 'next/server'

import { getAuthUser } from '@/lib/auth/session'
import { getMongoDb } from '@/lib/mongodb'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const DEFAULT_PREFS = {
  pushNotifications: true,
  emailUpdates: false,
  newMatches: true,
  messages: true,
  promotions: false,
}

type PrefsPayload = Partial<typeof DEFAULT_PREFS>

export async function GET(request: NextRequest) {
  const authUser = await getAuthUser(request)
  if (!authUser?.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const db = await getMongoDb()
  const prefs = await db
    .collection('notification_preferences')
    .findOne({ userId: authUser.userId }, { projection: { _id: 0, userId: 0 } })

  return NextResponse.json({ preferences: { ...DEFAULT_PREFS, ...(prefs ?? {}) } })
}

export async function PUT(request: NextRequest) {
  const authUser = await getAuthUser(request)
  if (!authUser?.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = (await request.json().catch(() => ({}))) as PrefsPayload
  const nextPrefs = {
    ...DEFAULT_PREFS,
    ...Object.fromEntries(
      Object.entries(body).filter(([key]) => key in DEFAULT_PREFS),
    ),
  }

  const db = await getMongoDb()
  await db.collection('notification_preferences').updateOne(
    { userId: authUser.userId },
    { $set: { ...nextPrefs, userId: authUser.userId, updatedAt: new Date() } },
    { upsert: true },
  )

  return NextResponse.json({ preferences: nextPrefs })
}
