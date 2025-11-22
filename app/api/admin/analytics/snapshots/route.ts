import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import {
  listAnalyticsSnapshots,
  materializeAnalyticsSnapshot,
  serializeAnalyticsSnapshot,
  SNAPSHOT_RANGES,
  SNAPSHOT_TYPES,
} from '@/lib/analytics/snapshot-service'
import { ensureAdminRequest } from '@/lib/admin/auth'

const querySchema = z.object({
  type: z.enum(SNAPSHOT_TYPES).default('activation'),
  range: z.enum(SNAPSHOT_RANGES).default('daily'),
  limit: z.coerce.number().min(1).max(30).optional(),
  refresh: z.coerce.boolean().optional(),
})

const materializeSchema = z.object({
  type: z.enum(SNAPSHOT_TYPES).default('activation'),
  range: z.enum(SNAPSHOT_RANGES).default('daily'),
  referenceDate: z.string().datetime().optional(),
  locale: z.string().min(2).max(32).optional(),
})

export async function GET(request: NextRequest) {
  const auth = ensureAdminRequest(request)
  if ('response' in auth) {
    return auth.response
  }

  const url = new URL(request.url)
  const parsed = querySchema.safeParse(Object.fromEntries(url.searchParams))

  if (!parsed.success) {
    return NextResponse.json({ success: false, errors: parsed.error.flatten() }, { status: 400 })
  }

  const { type, range, limit, refresh } = parsed.data

  if (refresh) {
    await materializeAnalyticsSnapshot({ type, range })
  }

  const snapshots = await listAnalyticsSnapshots({ type, range, limit })
  return NextResponse.json({ success: true, snapshots: snapshots.map(serializeAnalyticsSnapshot) })
}

export async function POST(request: NextRequest) {
  const auth = ensureAdminRequest(request)
  if ('response' in auth) {
    return auth.response
  }

  let json: unknown

  try {
    json = await request.json()
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = materializeSchema.safeParse(json)

  if (!parsed.success) {
    return NextResponse.json({ success: false, errors: parsed.error.flatten() }, { status: 400 })
  }

  const { type, range, referenceDate, locale } = parsed.data
  const snapshot = await materializeAnalyticsSnapshot({ type, range, referenceDate, locale })
  return NextResponse.json({ success: true, snapshot: serializeAnalyticsSnapshot(snapshot) })
}
