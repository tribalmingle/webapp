import { NextRequest, NextResponse } from 'next/server'

import { getAuthUser } from '@/lib/auth/session'
import { getMongoDb } from '@/lib/mongodb'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * POST /api/auth/logout-all
 * Invalidate all sessions for the current user across all devices
 * Used when blocking a user or on security events
 */
export async function POST(request: NextRequest) {
  const authUser = await getAuthUser(request)
  if (!authUser?.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const db = await getMongoDb()
  const now = new Date()

  try {
    // Invalidate all refresh tokens for this user
    await db.collection('refresh_tokens').updateMany(
      { userId: authUser.userId },
      { $set: { revokedAt: now, updatedAt: now } }
    )

    // Add to session blocklist (all tokens issued before now are invalid)
    await db.collection('session_revocations').insertOne({
      userId: authUser.userId,
      revokedAt: now,
      reason: 'logout_all_devices',
      createdAt: now,
    })

    console.log('[auth] All sessions invalidated for user', authUser.userId)

    return NextResponse.json({
      message: 'All sessions invalidated successfully',
      revokedAt: now,
    })
  } catch (error) {
    console.error('[auth] Failed to invalidate sessions', error)
    return NextResponse.json(
      { error: 'Failed to invalidate sessions' },
      { status: 500 }
    )
  }
}
