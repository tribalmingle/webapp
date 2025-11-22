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

    // Check if already liked
    const existingLike = await likesCollection.findOne({
      userId: userPayload.email,
      likedUserId: userId
    })

    if (existingLike) {
      return NextResponse.json(
        { success: false, message: 'Already liked this user' },
        { status: 400 }
      )
    }

    // Create like
    await likesCollection.insertOne({
      userId: userPayload.email,
      likedUserId: userId,
      createdAt: new Date()
    })

    return NextResponse.json({
      success: true,
      message: 'User liked successfully'
    })
  } catch (error) {
    console.error('Error liking user:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
