import { NextRequest, NextResponse } from 'next/server'
import { ensureAdminRequest } from '@/lib/admin/auth'
import { getMongoDb } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export async function POST(req: NextRequest) {
  const auth = ensureAdminRequest(req)
  if ('response' in auth) {
    return auth.response
  }

  try {
    const { userId, action } = await req.json()

    if (!userId || !action) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      )
    }

    const db = await getMongoDb()
    const usersCollection = db.collection('users')

    let updateData: any = {}

    switch (action) {
      case 'verify':
        updateData = { verified: true }
        break
      case 'suspend':
        updateData = { status: 'suspended' }
        break
      case 'ban':
        updateData = { status: 'banned' }
        break
      case 'delete':
        // Delete user
        await usersCollection.deleteOne({ _id: new ObjectId(userId) })
        return NextResponse.json({ success: true, message: 'User deleted' })
      default:
        return NextResponse.json(
          { success: false, message: 'Invalid action' },
          { status: 400 }
        )
    }

    // Update user
    const result = await usersCollection.updateOne(
      { _id: new ObjectId(userId) },
      { $set: updateData }
    )

    if (result.modifiedCount === 0) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, message: `User ${action}ed successfully` })
  } catch (error) {
    console.error('Error performing user action:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to perform action' },
      { status: 500 }
    )
  }
}
