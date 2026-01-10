import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'

import { getAuthUser } from '@/lib/auth/session'
import { getMongoDb } from '@/lib/mongodb'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const authUser = await getAuthUser(request)
  if (!authUser?.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json().catch(() => ({} as any))
  const preference = typeof body?.preference === 'string' ? body.preference : undefined
  const notes = typeof body?.notes === 'string' ? body.notes : undefined

  if (!preference) {
    return NextResponse.json({ error: 'preference is required' }, { status: 400 })
  }

  const db = await getMongoDb()
  const now = new Date()
  const doc = {
    userId: authUser.userId,
    preference,
    notes: notes ?? null,
    status: 'pending' as const,
    createdAt: now,
    updatedAt: now,
  }

  const result = await db.collection('concierge_requests').insertOne(doc)

  return NextResponse.json({
    request: {
      _id: result.insertedId.toString(),
      status: doc.status,
      preference: doc.preference,
      notes: doc.notes ?? undefined,
      createdAt: doc.createdAt,
    },
  }, { status: 201 })
}
