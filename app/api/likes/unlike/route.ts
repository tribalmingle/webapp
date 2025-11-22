import { NextRequest, NextResponse } from 'next/server'
import { getMongoDb } from '@/lib/mongodb'
import { getCurrentUser } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const userPayload = await getCurrentUser()
    
    if (!userPayload) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { userId } = body

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'User ID is required' },
        { status: 400 }
      )
    }

    const db = await getMongoDb()
    const likesCollection = db.collection('likes')

    // Delete like
    const result = await likesCollection.deleteOne({
      userId: userPayload.email,
      likedUserId: userId
    })

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, message: 'Like not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'User unliked successfully'
    })
  } catch (error) {
    console.error('Error unliking user:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
