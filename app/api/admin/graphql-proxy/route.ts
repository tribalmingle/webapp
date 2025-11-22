import { NextRequest, NextResponse } from 'next/server'

import { ensureAdminRequest } from '@/lib/admin/auth'

export async function POST(request: NextRequest) {
  const auth = ensureAdminRequest(request)
  if ('response' in auth) {
    const status = auth.response.status
    const message = status === 403 ? 'Forbidden' : 'Unauthorized'
    return NextResponse.json({ errors: [{ message }] }, { status })
  }

  const { query, variables } = await request.json()

  return NextResponse.json({
    data: {
      adminInsights: {
        latencyMs: 240 + Math.round(Math.random() * 60),
        queueDepth: 4 + Math.round(Math.random() * 6),
        lastSyncedAt: new Date().toISOString(),
        query,
        variables,
      },
    },
  })
}
