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
    const usersCollection = db.collection('users')
    const superlikesCollection = db.collection('superlikes')

    // Check if user is premium (superlikes require premium)
    const currentUser = await usersCollection.findOne({ email: userPayload.email })
    if (!currentUser?.isPremium) {
      return NextResponse.json(
        { success: false, message: 'Superlikes require premium membership' },
        { status: 403 }
      )
    }

    // Check if already superliked
    const existingSuperlike = await superlikesCollection.findOne({
      userId: userPayload.email,
      superlikedUserId: userId
    })

    if (existingSuperlike) {
      return NextResponse.json(
        { success: false, message: 'Already superliked this user' },
        { status: 400 }
      )
    }

    // Check daily superlike limit (3 per day for premium users)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const todaySuperlikes = await superlikesCollection.countDocuments({
      userId: userPayload.email,
      createdAt: { $gte: today }
    })

    if (todaySuperlikes >= 3) {
      return NextResponse.json(
        { success: false, message: 'Daily superlike limit reached (3 per day)' },
        { status: 429 }
      )
    }

    // Create superlike
    await superlikesCollection.insertOne({
      userId: userPayload.email,
      superlikedUserId: userId,
      createdAt: new Date()
    })

    // Check for match (if target user liked back)
    const likesCollection = db.collection('likes')
    const reciprocalLike = await likesCollection.findOne({
      userId,
      likedUserId: userPayload.email
    })

    let matchCreated = false
    if (reciprocalLike) {
      const matchesCollection = db.collection('matches')
      // Check if match already exists
      const existingMatch = await matchesCollection.findOne({
        $or: [
          { userId1: userPayload.email, userId2: userId },
          { userId1: userId, userId2: userPayload.email }
        ]
      })

      if (!existingMatch) {
        await matchesCollection.insertOne({
          userId1: userPayload.email,
          userId2: userId,
          createdAt: new Date(),
          superlikeMatch: true
        })
        matchCreated = true
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Superlike sent successfully',
      matchCreated
    })

  } catch (error: any) {
    console.error('[likes/superlike] Error:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
