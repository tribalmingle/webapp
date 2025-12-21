import { NextRequest, NextResponse } from 'next/server'
import { getMongoDb } from '@/lib/mongodb'
import { getCurrentUser } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    const userPayload = await getCurrentUser()
    
    if (!userPayload) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const db = await getMongoDb()
    const likesCollection = db.collection('likes')
    const usersCollection = db.collection('users')

    // Get current user's gender to filter opposite gender only
    const currentUser = await usersCollection.findOne({ email: userPayload.email })
    const userGender = currentUser?.gender?.toLowerCase()

    // Find all users I liked
    const likes = await likesCollection
      .find({ userId: userPayload.email })
      .sort({ createdAt: -1 })
      .toArray()

    // Get user details for each like - filter by opposite gender (case-insensitive)
    const likesWithDetails = await Promise.all(
      likes.map(async (like) => {
        const userQuery: any = { email: like.likedUserId }
        if (userGender === 'male') {
          userQuery.gender = { $regex: new RegExp('^female$', 'i') }
        } else if (userGender === 'female') {
          userQuery.gender = { $regex: new RegExp('^male$', 'i') }
        }
        const user = await usersCollection.findOne(userQuery)
        if (!user) return null

        return {
          _id: like._id.toString(),
          userId: user.email,
          name: user.name,
          age: user.age,
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
