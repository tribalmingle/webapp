import { NextRequest, NextResponse } from 'next/server'

import { getMongoDb } from '@/lib/mongodb'
import { COLLECTIONS } from '@/lib/db/collections'
import { getCurrentUser } from '@/lib/auth'

interface FilterPayload {
  unreadOnly?: boolean
  verifiedOnly?: boolean
  translatorOnly?: boolean
  query?: string
}

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser?.userId) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    const body = (await request.json()) as { filters?: FilterPayload }
    if (!body?.filters) {
      return NextResponse.json({ success: false, message: 'filters payload required' }, { status: 400 })
    }

    const filters = {
      unreadOnly: Boolean(body.filters.unreadOnly),
      verifiedOnly: Boolean(body.filters.verifiedOnly),
      translatorOnly: Boolean(body.filters.translatorOnly),
      query: body.filters.query?.slice(0, 120) ?? '',
    }

    const db = await getMongoDb()
    await db.collection(COLLECTIONS.CHAT_THREADS).updateMany(
      { participants: { $in: [currentUser.userId] } },
      {
        $set: {
          [`metadata.inboxPreferences.${currentUser.userId}`]: {
            filters,
            updatedAt: new Date(),
          },
        },
      },
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[chat-preferences] failed to persist filters', error)
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}
