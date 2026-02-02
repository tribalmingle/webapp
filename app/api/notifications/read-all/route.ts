import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { getCurrentUser } from '@/lib/auth'
import { getMongoDb } from '@/lib/mongodb'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    const db = await getMongoDb()
    const usersCollection = db.collection('users')
    const notificationsCollection = db.collection('notifications')

    let userObjectId: ObjectId | null = null
    if (user.userId && ObjectId.isValid(user.userId)) {
      userObjectId = new ObjectId(user.userId)
    } else if (user.email) {
      const userDoc = await usersCollection.findOne({ email: user.email.toLowerCase() }, { projection: { _id: 1 } })
      if (userDoc?._id) userObjectId = userDoc._id
    }

    if (!userObjectId) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    const now = new Date()
    await notificationsCollection.updateMany(
      { userId: userObjectId, readAt: { $exists: false } },
      { $set: { readAt: now, updatedAt: now } }
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error marking all notifications read:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to mark notifications read' },
      { status: 500 }
    )
  }
}
