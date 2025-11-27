import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { getCollection } from '@/lib/db/mongodb'
import { COLLECTIONS } from '@/lib/db/collections'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status') || 'open'
    const category = searchParams.get('category')
    const priority = searchParams.get('priority')

    const match: any = { status }
    if (category) match.category = category
    if (priority) match.priority = priority

    const collection = await getCollection(COLLECTIONS.TRUST_REPORTS)
    const reports = await collection.aggregate([
      { $match: match },
      { $sort: { priority: -1, createdAt: 1 } },
      { $limit: 100 },
      {
        $lookup: {
          from: COLLECTIONS.USERS,
          localField: 'reportedUserId',
          foreignField: '_id',
          as: 'reportedUser',
        },
      },
      {
        $lookup: {
          from: COLLECTIONS.USERS,
          localField: 'reporterId',
          foreignField: '_id',
          as: 'reporter',
        },
      },
      { $unwind: { path: '$reportedUser', preserveNullAndEmptyArrays: true } },
      { $unwind: { path: '$reporter', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          reportedUserId: 1,
          reporterId: 1,
          category: 1,
          subcategory: 1,
          description: 1,
          evidence: 1,
          priority: 1,
          status: 1,
          assignedTo: 1,
          createdAt: 1,
          resolvedAt: 1,
          reportedUser: {
            _id: 1,
            name: 1,
            profilePhoto: 1,
            email: 1,
          },
          reporter: {
            _id: 1,
            name: 1,
          },
        },
      },
    ]).toArray()

    return NextResponse.json(reports)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
