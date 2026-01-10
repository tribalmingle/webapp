import { NextRequest, NextResponse } from 'next/server'

import { getAuthUser } from '@/lib/auth/session'
import { getMongoDb } from '@/lib/mongodb'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const DEFAULT_SETTINGS = {
  distance: 50,
  ageMin: 21,
  ageMax: 45,
  tribes: '',
  pushNotifications: true,
  emailUpdates: false,
  showOnlineStatus: true,
  readReceipts: true,
  paused: false,
}

type SettingsPayload = Partial<typeof DEFAULT_SETTINGS>

export async function GET(request: NextRequest) {
  const authUser = await getAuthUser(request)
  if (!authUser?.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const db = await getMongoDb()
  const settings = await db
    .collection('user_settings')
    .findOne({ userId: authUser.userId }, { projection: { _id: 0, userId: 0 } })

  return NextResponse.json({ settings: { ...DEFAULT_SETTINGS, ...(settings ?? {}) } })
}

export async function PUT(request: NextRequest) {
  const authUser = await getAuthUser(request)
  if (!authUser?.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = (await request.json().catch(() => ({}))) as SettingsPayload

  const nextSettings = {
    ...DEFAULT_SETTINGS,
    ...Object.fromEntries(
      Object.entries(body).filter(([key]) => key in DEFAULT_SETTINGS),
    ),
  }

  const db = await getMongoDb()
  await db.collection('user_settings').updateOne(
    { userId: authUser.userId },
    { $set: { ...nextSettings, userId: authUser.userId, updatedAt: new Date() } },
    { upsert: true },
  )

  return NextResponse.json({ settings: nextSettings })
}
