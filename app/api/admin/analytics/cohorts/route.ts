import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { getCohortExplorerData } from '@/lib/analytics/cohort-service'
import { ensureAdminRequest } from '@/lib/admin/auth'

const querySchema = z.object({
  dimension: z.string().min(2).max(64).optional(),
  limit: z.coerce.number().int().min(1).max(20).optional(),
})

export async function GET(request: NextRequest) {
  const auth = ensureAdminRequest(request)
  if ('response' in auth) {
    return auth.response
  }

  const url = new URL(request.url)
  const queryObject = Object.fromEntries(url.searchParams)
  const validation = querySchema.safeParse(queryObject)

  if (!validation.success) {
    return NextResponse.json({ success: false, errors: validation.error.flatten().fieldErrors }, { status: 400 })
  }

  try {
    const data = await getCohortExplorerData({
      dimension: validation.data.dimension,
      limit: validation.data.limit,
    })

    return NextResponse.json({ success: true, cohorts: data })
  } catch (error) {
    console.error('[admin] cohort explorer failed', error)
    return NextResponse.json({ success: false, error: 'Unable to load cohort analytics' }, { status: 500 })
  }
}
