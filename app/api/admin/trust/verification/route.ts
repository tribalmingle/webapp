import { NextResponse } from 'next/server'
import { getCollection } from '@/lib/db/mongodb'
import { COLLECTIONS } from '@/lib/db/collections'

export async function GET() {
  try {
    const collection = await getCollection(COLLECTIONS.PHOTO_VERIFICATION_SESSIONS)
    const sessions = await collection.aggregate([
      { $match: { status: { $in: ['pending_manual_review', 'flagged'] } } },
      { $sort: { createdAt: 1 } },
      { $limit: 50 },
      {
        $lookup: {
          from: COLLECTIONS.USERS,
          localField: 'userId',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          userId: 1,
          status: 1,
          detectionConfidence: 1,
          referenceImageUrl: 1,
          auditImageUrl: 1,
          createdAt: 1,
          user: {
            _id: 1,
            name: 1,
            email: 1,
            profilePhoto: 1,
          },
        },
      },
    ]).toArray()

    return NextResponse.json(sessions)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
