import { NextRequest, NextResponse } from 'next/server'

import { ensureAdminRequest } from '@/lib/admin/auth'
import { getTrustAutomationSnapshot } from '@/lib/trust/trust-automation-service'

export async function GET(request: NextRequest) {
  const auth = ensureAdminRequest(request)
  if ('response' in auth) {
    return auth.response
  }

  const url = new URL(request.url)
  const limitParam = url.searchParams.get('limit')
  const parsedLimit = typeof limitParam === 'string' ? Number.parseInt(limitParam, 10) : undefined
  const limit = typeof parsedLimit === 'number' && Number.isFinite(parsedLimit)
    ? Math.max(1, Math.min(parsedLimit, 25))
    : undefined

  try {
    const snapshot = await getTrustAutomationSnapshot({ limit })
    return NextResponse.json({ success: true, snapshot })
  } catch (error) {
    console.error('[admin] trust automation snapshot failed', error)
    return NextResponse.json(
      { success: false, error: 'Unable to load trust automation snapshot' },
      { status: 500 },
    )
  }
}
