import { NextRequest, NextResponse } from 'next/server'

import { getAuthUser } from '@/lib/auth/session'
import { getMongoDb } from '@/lib/mongodb'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const authUser = await getAuthUser(request)
  if (!authUser?.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const db = await getMongoDb()
  const rows = await db
    .collection('concierge_requests')
    .find({ userId: authUser.userId })
    .sort({ createdAt: -1 })
    .limit(50)
    .toArray()

  const requests = rows.map((row) => ({
    _id: row._id?.toString() ?? 'unknown',
    status: row.status ?? 'pending',
    preference: row.preference,
    notes: row.notes ?? undefined,
    createdAt: row.createdAt,
  }))

  return NextResponse.json({ requests })
}
