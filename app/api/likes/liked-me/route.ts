import { NextRequest, NextResponse } from 'next/server'
import { getMongoDb } from '@/lib/mongodb'
import { getCurrentUser } from '@/lib/auth'
import { ObjectId } from 'mongodb'

export async function GET(req: NextRequest) {
  try {
    const userPayload = await getCurrentUser(req)
    
    if (!userPayload) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const db = await getMongoDb()
    const likesCollection = db.collection('likes')
    const usersCollection = db.collection('users')
    const passesCollection = db.collection('passes')

    // Find all users who liked me
    const userObjectId = userPayload.userId && ObjectId.isValid(userPayload.userId)
      ? new ObjectId(userPayload.userId)
      : null
    const likes = await likesCollection
      .find({
        $or: [
          ...(userObjectId ? [{ likedUserId: userObjectId }] : []),
          { likedUserId: userPayload.email },
        ],
      })
      .sort({ createdAt: -1 })
      .toArray()

    const now = new Date()
    const passDocs = await passesCollection
      .find({
        $and: [
          {
            $or: [
              ...(userObjectId ? [{ userId: userObjectId }] : []),
              { userId: userPayload.email },
            ],
          },
          {
            $or: [{ expiresAt: { $exists: false } }, { expiresAt: { $gt: now } }],
          },
        ],
      })
      .toArray()

    const passedIds = new Set(
      passDocs
        .map((pass) => {
          if (pass.passedUserId?.toHexString) return pass.passedUserId.toHexString()
          return String(pass.passedUserId)
        })
        .filter(Boolean)
    )

    const likerObjectIds = likes
      .map((like) => like.userId)
      .filter((id) => ObjectId.isValid(id))
      .map((id) => new ObjectId(id))

    const alreadyLikedSet = new Set<string>()
    if (userObjectId && likerObjectIds.length > 0) {
      const reverseLikes = await likesCollection
        .find({ userId: userObjectId, likedUserId: { $in: likerObjectIds } })
        .project({ likedUserId: 1 })
        .toArray()
      reverseLikes.forEach((like) => {
        if (like.likedUserId?.toHexString) {
          alreadyLikedSet.add(like.likedUserId.toHexString())
        } else if (like.likedUserId) {
          alreadyLikedSet.add(String(like.likedUserId))
        }
      })
    }

    // Get user details for each like
    const likesWithDetails = await Promise.all(
      likes.map(async (like) => {
        const likerUserId = like.userId
        const user = ObjectId.isValid(likerUserId)
          ? await usersCollection.findOne({ _id: new ObjectId(likerUserId) })
          : await usersCollection.findOne({ email: likerUserId })
        if (!user) return null

        const userIdValue = user._id?.toString?.() ?? String(user._id)
        const isPassed = passedIds.has(userIdValue) || passedIds.has(user.email)
        if (isPassed) return null

        const alreadyLiked = alreadyLikedSet.has(userIdValue) || alreadyLikedSet.has(user.email)

        return {
          _id: like._id.toString(),
          userId: userIdValue,
          email: user.email,
          name: user.name,
          age: user.age,
          gender: user.gender,
          city: user.city || 'Location not set',
          tribe: user.tribe || 'No tribe',
          profilePhoto: user.profilePhotos?.[0] || user.profilePhoto || '',
          likedAt: like.createdAt,
          alreadyLiked,
        }
      })
    )

    const filteredLikes = likesWithDetails.filter(Boolean)

    return NextResponse.json({
      success: true,
      likes: filteredLikes
    })
  } catch (error) {
    console.error('Error fetching who liked me:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
