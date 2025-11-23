import { NextRequest, NextResponse } from 'next/server'

import { ensureAdminRequest } from '@/lib/admin/auth'
import { resolveModerationJob } from '@/lib/services/moderation-review-service'

const RESOLUTIONS = new Set(['approve', 'reject', 'request_reshoot'])

export async function PATCH(request: NextRequest, context: any) {
  const auth = ensureAdminRequest(request)
  if ('response' in auth) {
    return auth.response
  }

  const jobId = context?.params?.jobId
  if (!jobId) {
    return NextResponse.json({ success: false, error: 'Missing job id' }, { status: 400 })
  }

  const payload = await request.json().catch(() => null)
  const resolution = payload?.resolution
  const note = typeof payload?.note === 'string' ? payload.note : undefined

  if (!RESOLUTIONS.has(resolution)) {
    return NextResponse.json({ success: false, error: 'Invalid resolution' }, { status: 400 })
  }

  try {
    await resolveModerationJob({
      jobId,
      reviewerEmail: auth.session.email,
      resolution,
      note,
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[admin] moderation job resolution failed', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unable to update moderation job' },
      { status: 400 },
    )
  }
}
