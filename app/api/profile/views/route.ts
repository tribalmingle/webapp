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
    const viewsCollection = db.collection('profile_views')
    const usersCollection = db.collection('users')

    // Get current user's gender to filter opposite gender only
    const currentUser = await usersCollection.findOne({ email: userPayload.email })
    const userGender = currentUser?.gender?.toLowerCase()

    // Find all profile views
    const views = await viewsCollection
      .find({ viewedUserId: userPayload.email })
      .sort({ viewedAt: -1 })
      .toArray()

    // Get user details for each view - filter by opposite gender (case-insensitive)
    const viewsWithDetails = await Promise.all(
      views.map(async (view) => {
        const userQuery: any = { email: view.userId }
        if (userGender === 'male') {
          userQuery.gender = { $regex: new RegExp('^female$', 'i') }
        } else if (userGender === 'female') {
          userQuery.gender = { $regex: new RegExp('^male$', 'i') }
        }
        const user = await usersCollection.findOne(userQuery)
        if (!user) return null

        return {
          _id: view._id.toString(),
          userId: user.email,
          name: user.name,
          age: user.age,
          city: user.city || 'Location not set',
          tribe: user.tribe || 'No tribe',
          profilePhoto: user.profilePhotos?.[0] || user.profilePhoto || '',
          viewedAt: view.viewedAt,
          duration: view.duration || 0
        }
      })
    )

    const filteredViews = viewsWithDetails.filter(Boolean)

    return NextResponse.json({
      success: true,
      views: filteredViews
    })
  } catch (error) {
    console.error('Error fetching profile views:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

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
    const { viewedUserId, duration } = body

    if (!viewedUserId) {
      return NextResponse.json(
        { success: false, message: 'Viewed user ID is required' },
        { status: 400 }
      )
    }

    // Don't track views of own profile
    if (viewedUserId === userPayload.email) {
      return NextResponse.json({
        success: true,
        message: 'Own profile view not tracked'
      })
    }

    const db = await getMongoDb()
    const viewsCollection = db.collection('profile_views')

    // Check if already viewed recently (within last hour)
    const recentView = await viewsCollection.findOne({
      userId: userPayload.email,
      viewedUserId: viewedUserId,
      viewedAt: { $gte: new Date(Date.now() - 60 * 60 * 1000) }
    })

    if (recentView) {
      // Update duration if viewing again
      await viewsCollection.updateOne(
        { _id: recentView._id },
        { 
          $set: { 
            duration: (recentView.duration || 0) + (duration || 0),
            viewedAt: new Date()
          } 
        }
      )
    } else {
      // Create new view record
      await viewsCollection.insertOne({
        userId: userPayload.email,
        viewedUserId: viewedUserId,
        viewedAt: new Date(),
        duration: duration || 0
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Profile view tracked'
    })
  } catch (error) {
    console.error('Error tracking profile view:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
