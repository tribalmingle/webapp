import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import clientPromise from '@/lib/mongodb'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Not authenticated' },
        { status: 401 }
      )
    }

    const client = await clientPromise
    const db = client.db(process.env.MONGODB_DB || 'tribalmingle')
    const userEmail = user.email

    // Count likes received (people who liked me)
    const likesCount = await db.collection('likes').countDocuments({
      likedUserId: userEmail
    })

    // Count unread messages
    const messagesCount = await db.collection('messages').countDocuments({
      receiverId: userEmail,
      read: { $ne: true }
    })

    // Count profile views
    const viewsCount = await db.collection('profile_views').countDocuments({
      viewedUserId: userEmail
    })

    // Count mutual matches (both users liked each other)
    const mutualLikes = await db.collection('likes').find({
      userId: userEmail
    }).toArray()

    let matchesCount = 0
    for (const like of mutualLikes) {
      const mutualMatch = await db.collection('likes').findOne({
        userId: like.likedUserId,
        likedUserId: userEmail
      })
      if (mutualMatch) {
        matchesCount++
      }
    }

    return NextResponse.json({
      success: true,
      stats: {
        likes: likesCount,
        messages: messagesCount,
        views: viewsCount,
        matches: matchesCount
      }
    })
  } catch (error) {
    console.error('Get stats error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to get stats' },
      { status: 500 }
    )
  }
}
