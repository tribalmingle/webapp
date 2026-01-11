import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { getAuthUser } from '@/lib/auth/session'
import { getMongoDb } from '@/lib/mongodb'
import { CollectionNames } from '@/lib/data/collection-names'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * GET /api/users/stats
 * Get user stats (matches, views, chats, likes) for mobile home screen
 */
export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request)
    if (!authUser?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const db = await getMongoDb()
    const userId = new ObjectId(authUser.userId)

    // Get matches count
    const matchesCount = await db.collection('matches').countDocuments({
      $or: [
        { userId1: userId },
        { userId2: userId }
      ],
      status: 'active'
    })

    // Get profile views count (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const viewsCount = await db.collection('profile_views').countDocuments({
      viewedUserId: userId,
      createdAt: { $gte: thirtyDaysAgo }
    })

    // Get chats count (conversations with at least 1 message)
    const chatsCount = await db.collection('conversations').countDocuments({
      participants: userId,
      messageCount: { $gt: 0 }
    })

    // Get likes count (likes received)
    const likesCount = await db.collection('likes').countDocuments({
      likedUserId: userId,
      status: 'pending' // Only count pending likes (not matched yet)
    })

    return NextResponse.json({
      success: true,
      stats: {
        matches: matchesCount,
        views: viewsCount,
        chats: chatsCount,
        likes: likesCount
      }
    })

  } catch (error) {
    console.error('Error fetching user stats:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch stats',
        stats: { matches: 0, views: 0, chats: 0, likes: 0 }
      },
      { status: 500 }
    )
  }
}
