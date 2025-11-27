import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { getCollection } from '@/lib/db/mongodb'

type RouteParams = {
  params: Promise<{ eventId: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { eventId } = await params
    const registrations = await getCollection('event_registrations')
    
    const regs = await registrations.aggregate([
      { $match: { eventId: new ObjectId(eventId) } },
      {
        $lookup: {
          from: 'users',
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
          paymentStatus: 1,
          ticketType: 1,
          registeredAt: 1,
          checkedInAt: 1,
          user: {
            _id: 1,
            name: 1,
            email: 1,
            profilePhoto: 1,
          },
        },
      },
    ]).toArray()
    
    return NextResponse.json(regs)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
