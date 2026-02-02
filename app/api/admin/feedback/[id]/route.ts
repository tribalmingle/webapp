import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { getMongoDb } from '@/lib/mongodb'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, message: 'Invalid feedback id.' }, { status: 400 })
    }

    const body = await request.json().catch(() => ({}))
    const nextStatus = typeof body?.status === 'string' ? body.status : 'read'

    const db = await getMongoDb()
    const feedbackCollection = db.collection('feedback')

    const now = new Date()
    await feedbackCollection.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          status: nextStatus,
          readAt: nextStatus === 'read' ? now : undefined,
          updatedAt: now,
        },
      }
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Admin feedback update failed:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to update feedback.' },
      { status: 500 }
    )
  }
}
