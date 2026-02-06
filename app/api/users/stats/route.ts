import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { getCurrentUser } from '@/lib/auth'
import { getDb } from '@/lib/db/mongodb'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * GET /api/users/stats
 * Get user stats (matches, views, chats, likes) for mobile home screen
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const db = await getDb()
    const usersCollection = db.collection('users')
    const likesCollection = db.collection('likes')
    const matchesCollection = db.collection('matches')
    const viewsCollection = db.collection('profile_views')
    const messagesCollection = db.collection('messages')

    const userEmail = user.email?.toLowerCase()
    let userObjectId: ObjectId | null = null

    if (ObjectId.isValid(user.userId)) {
      userObjectId = new ObjectId(user.userId)
    } else if (userEmail) {
      const userDoc = await usersCollection.findOne({ email: userEmail }, { projection: { _id: 1 } })
      if (userDoc?._id) userObjectId = userDoc._id
    }

    if (!userObjectId && !userEmail) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get matches count
    const matchesCount = userObjectId
      ? await matchesCollection.countDocuments({
          $and: [
            {
              $or: [
                { memberIds: userObjectId },
                { userId1: userObjectId },
                { userId2: userObjectId },
              ],
            },
            {
              $or: [
                { state: 'active' },
                { status: 'active' },
                { state: { $exists: false } },
                { status: { $exists: false } },
              ],
            },
          ],
        })
      : 0

    // Get profile views count (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const viewsCount = userEmail
      ? await viewsCollection.countDocuments({
          viewedUserId: userEmail,
          $or: [
            { viewedAt: { $gte: thirtyDaysAgo } },
            { createdAt: { $gte: thirtyDaysAgo } },
          ],
        })
      : 0

    // Get chats count (conversations with at least 1 message)
    let chatsCount = 0
    if (userEmail) {
      const sentTo = await messagesCollection.distinct('receiverId', { senderId: userEmail })
      const receivedFrom = await messagesCollection.distinct('senderId', { receiverId: userEmail })
      const normalize = (value: unknown) =>
        typeof value === 'string' ? value.trim().toLowerCase() : ''

      const uniquePartners = new Set(
        [...sentTo, ...receivedFrom]
          .map(normalize)
          .filter((value) => value && value !== userEmail)
      )
      chatsCount = uniquePartners.size
    }

    // Get likes count (likes received)
    const likesTargetFilters = [{ likedUserId: userObjectId }]
    if (userEmail) {
      likesTargetFilters.push({ likedUserId: userEmail })
    }

    const likesCount = userObjectId
      ? await likesCollection.countDocuments({
          $and: [
            { $or: likesTargetFilters },
            { $or: [{ status: 'pending' }, { status: { $exists: false } }] },
          ],
        })
      : 0

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
