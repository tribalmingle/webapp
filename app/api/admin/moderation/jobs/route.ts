import { NextRequest, NextResponse } from 'next/server'

import { ensureAdminRequest } from '@/lib/admin/auth'
import { listModerationJobs } from '@/lib/services/moderation-review-service'
import type { ModerationJobStatus } from '@/lib/services/moderation-review-service'

export async function GET(request: NextRequest) {
  const auth = ensureAdminRequest(request)
  if ('response' in auth) {
    return auth.response
  }

  const url = new URL(request.url)
  const limitParam = url.searchParams.get('limit')
  const statusParam = url.searchParams.get('status')

  const limit = limitParam ? Number.parseInt(limitParam, 10) : undefined
  const statuses = statusParam
    ? sanitizeStatuses(statusParam.split(',').map((value) => value.trim()).filter(Boolean))
    : undefined

  try {
    const items = await listModerationJobs({ limit, statuses })
    return NextResponse.json({ success: true, items })
  } catch (error) {
    console.error('[admin] moderation job fetch failed', error)
    return NextResponse.json(
      { success: false, error: 'Unable to load moderation jobs' },
      { status: 500 },
    )
  }
}

function sanitizeStatuses(values: string[]): ModerationJobStatus[] | undefined {
  const allowed: ModerationJobStatus[] = ['pending', 'processing', 'retry', 'completed', 'failed']
  const normalized = values.filter((value): value is ModerationJobStatus => (allowed as string[]).includes(value))
  return normalized.length ? normalized : undefined
}
