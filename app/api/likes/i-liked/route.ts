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

    // Find all users I liked
    const userObjectId = userPayload.userId && ObjectId.isValid(userPayload.userId)
      ? new ObjectId(userPayload.userId)
      : null
    const likes = await likesCollection
      .find({
        $or: [
          ...(userObjectId ? [{ userId: userObjectId }] : []),
          { userId: userPayload.email },
        ],
      })
      .sort({ createdAt: -1 })
      .toArray()

    // Get user details for each like
    const likesWithDetails = await Promise.all(
      likes.map(async (like) => {
        const likedUserId = like.likedUserId
        const user = ObjectId.isValid(likedUserId)
          ? await usersCollection.findOne({ _id: new ObjectId(likedUserId) })
          : await usersCollection.findOne({ email: likedUserId })
        if (!user) return null

        return {
          _id: like._id.toString(),
          userId: user._id?.toString(),
          email: user.email,
          name: user.name,
          age: user.age,
          gender: user.gender,
          city: user.city || 'Location not set',
          tribe: user.tribe || 'No tribe',
          profilePhoto: user.profilePhotos?.[0] || user.profilePhoto || '',
          likedAt: like.createdAt
        }
      })
    )

    const filteredLikes = likesWithDetails.filter(Boolean)

    return NextResponse.json({
      success: true,
      likes: filteredLikes
    })
  } catch (error) {
    console.error('Error fetching I liked:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
