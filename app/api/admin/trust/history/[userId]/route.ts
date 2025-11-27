import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { getCollection } from '@/lib/db/mongodb'
import { COLLECTIONS } from '@/lib/db/collections'

type RouteParams = {
  params: Promise<{ userId: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = await params
    const moderationActions = await getCollection(COLLECTIONS.MODERATION_ACTIONS)

    const history = await moderationActions.aggregate([
      { $match: { targetUserId: new ObjectId(userId) } },
      { $sort: { createdAt: -1 } },
      {
        $lookup: {
          from: COLLECTIONS.USERS,
          localField: 'moderatorId',
          foreignField: '_id',
          as: 'moderator',
        },
      },
      { $unwind: { path: '$moderator', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          action: 1,
          reason: 1,
          evidence: 1,
          createdAt: 1,
          expiresAt: 1,
          moderator: {
            _id: 1,
            name: 1,
            email: 1,
          },
        },
      },
    ]).toArray()

    return NextResponse.json(history)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
