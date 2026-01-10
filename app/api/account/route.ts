import { NextRequest, NextResponse } from 'next/server'

import { getAuthUser } from '@/lib/auth/session'
import { getMongoDb } from '@/lib/mongodb'
import { CollectionNames } from '@/lib/data/collection-names'

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

export async function GET(request: NextRequest) {
  const authUser = await getAuthUser(request)
  if (!authUser?.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const db = await getMongoDb()
  const account = await db.collection(CollectionNames.USERS).findOne({ _id: authUser.userId })

  // Settings are stored in a dedicated collection to avoid mutating the main user record
  const settings = await db
    .collection('user_settings')
    .findOne({ userId: authUser.userId }, { projection: { _id: 0, userId: 0 } })

  return NextResponse.json({
    account: {
      _id: authUser.userId,
      email: account?.email ?? undefined,
      name: account?.name ?? authUser.name ?? undefined,
      subscriptionPlan: account?.subscriptionPlan ?? 'free',
      settings: { ...DEFAULT_SETTINGS, ...(settings ?? {}) },
    },
  })
}

export async function DELETE(request: NextRequest) {
  const authUser = await getAuthUser(request)
  if (!authUser?.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json().catch(() => ({} as any))
  const reason = typeof body?.reason === 'string' ? body.reason : 'not_provided'

  const db = await getMongoDb()
  const now = new Date()
  const deletionDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

  await db.collection('account_deletions').insertOne({
    userId: authUser.userId,
    status: 'pending',
    reason,
    requestedAt: now,
    scheduledFor: deletionDate,
    createdAt: now,
    updatedAt: now,
  })

  await db.collection(CollectionNames.USERS).updateOne(
    { _id: authUser.userId },
    {
      $set: {
        deletion_scheduled_at: now,
        deletion_scheduled_for: deletionDate,
        updated_at: now,
      },
    },
  )

  return NextResponse.json({
    message: 'Account deleted successfully',
    scheduledFor: deletionDate,
    status: 'pending',
  })
}
