import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db/mongodb'
import { getCurrentUser } from '@/lib/auth'
import { ObjectId } from 'mongodb'

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req)
    
    if (!user?.userId) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { userId } = body

    const likedUserIdValue =
      typeof userId === 'string'
        ? userId
        : userId?.userId ?? userId?.id ?? userId?._id ?? userId?.$oid

    if (!likedUserIdValue) {
      return NextResponse.json(
        { success: false, message: 'User ID is required' },
        { status: 400 }
      )
    }

    const db = await getDb()
    const likesCollection = db.collection('likes')
    const usersCollection = db.collection('users')

    let currentUserObjectId: ObjectId | null = null
    if (ObjectId.isValid(user.userId)) {
      currentUserObjectId = new ObjectId(user.userId)
    } else if (user.email) {
      const currentUserDoc = await usersCollection.findOne(
        { email: user.email.toLowerCase() },
        { projection: { _id: 1 } }
      )
      if (currentUserDoc?._id) {
        currentUserObjectId = currentUserDoc._id
      }
    }

    if (!currentUserObjectId) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    let likedUserObjectId: ObjectId | null = null
    if (ObjectId.isValid(likedUserIdValue)) {
      likedUserObjectId = new ObjectId(likedUserIdValue)
    } else {
      const userDoc = await usersCollection.findOne({
        email: String(likedUserIdValue).toLowerCase(),
      })
      if (userDoc?._id) {
        likedUserObjectId = userDoc._id
      }
    }

    if (!likedUserObjectId) {
      return NextResponse.json(
        { success: false, message: 'Invalid user ID' },
        { status: 400 }
      )
    }

    // Check if already liked
    const existingLike = await likesCollection.findOne({
      userId: currentUserObjectId,
      likedUserId: likedUserObjectId
    })

    if (existingLike) {
      return NextResponse.json(
        { success: false, message: 'Already liked this user' },
        { status: 400 }
      )
    }

    // Create like
    await likesCollection.insertOne({
      userId: currentUserObjectId,
      likedUserId: likedUserObjectId,
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
