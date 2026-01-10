import { NextResponse } from 'next/server'

import { getAuthUser } from '@/lib/auth/session'
import { getMongoDb } from '@/lib/mongodb'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const authUser = await getAuthUser(request as any)
  if (!authUser?.userId) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const db = await getMongoDb()
  const sessions = await db
    .collection('boost_sessions')
    .find({ userId: authUser.userId, status: { $in: ['active', 'pending'] } })
    .sort({ updatedAt: -1 })
    .limit(1)
    .toArray()

  const current = sessions[0]
  const minutesRemaining = current?.endsAt
    ? Math.max(0, Math.round((current.endsAt.getTime() - Date.now()) / 60000))
    : undefined

  const windows = await db
    .collection('boost_windows')
    .find({ active: true })
    .sort({ start: 1 })
    .limit(10)
    .toArray()

  return NextResponse.json({
    active: current?.status === 'active',
    currentBoost: current
      ? {
          active: current.status === 'active',
          startTime: current.startedAt?.toISOString(),
          endTime: current.endsAt?.toISOString(),
          minutesRemaining,
          viewsGained: current.viewsGained ?? 0,
        }
      : null,
    spotlightWindows: windows.map((w) => ({
      _id: w._id?.toString() ?? 'unknown',
      windowTime: w.start?.toISOString?.() ?? null,
      duration: w.duration ?? w.windowMinutes ?? 60,
      currentHighestBid: w.currentHighestBid ?? 0,
      minimumBid: w.minBid ?? 1,
      totalBids: w.totalBids ?? 0,
    })),
  })
}
