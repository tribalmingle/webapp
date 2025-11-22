import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'

import { ensureAdminRequest } from '@/lib/admin/auth'

export async function POST(request: NextRequest) {
  const auth = ensureAdminRequest(request, { roles: ['superadmin'] })
  if ('response' in auth) {
    return auth.response
  }

  const { targetUserId, reason } = await request.json()

  if (!targetUserId || typeof targetUserId !== 'string') {
    return NextResponse.json({ success: false, message: 'targetUserId is required' }, { status: 400 })
  }

  if (!reason || typeof reason !== 'string' || reason.trim().length < 20) {
    return NextResponse.json({ success: false, message: 'Reason must be at least 20 characters' }, { status: 422 })
  }

  const expiresAt = Date.now() + 15 * 60 * 1000

  return NextResponse.json({
    success: true,
    token: randomUUID(),
    expiresAt,
    targetUserId,
    audit: {
      reviewer: auth.session.email,
      reason,
    },
  })
}
