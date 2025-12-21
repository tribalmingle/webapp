import { NextRequest, NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { verifyToken } from '@/lib/auth'
import { ObjectId } from 'mongodb'

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authResult = await verifyToken(request)
    if (!authResult.valid || !authResult.payload?.userId) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { phone, ...profileData } = body

    if (!phone) {
      return NextResponse.json(
        { success: false, message: 'Phone number is required' },
        { status: 400 }
      )
    }

    const client = await clientPromise
    const db = client.db(process.env.MONGODB_DB || 'tribalmingle')

    // Check if phone is already in use by another user
    const existingPhone = await db.collection('users').findOne({
      phone,
      _id: { $ne: new ObjectId(authResult.payload.userId) }
    })

    if (existingPhone) {
      return NextResponse.json(
        { success: false, message: 'This phone number is already in use' },
        { status: 409 }
      )
    }

    // Update user with phone and mark registration complete
    const updateData: any = {
      phone,
      registrationComplete: true,
      verified: true, // Mark as verified since they completed phone verification
      updatedAt: new Date(),
    }

    // Add any additional profile data
    if (profileData.tribe) updateData.tribe = profileData.tribe
    if (profileData.city) updateData.city = profileData.city
    if (profileData.country) updateData.country = profileData.country
    if (profileData.bio) updateData.bio = profileData.bio
    if (profileData.interests) updateData.interests = profileData.interests
    if (profileData.profilePhotos) updateData.profilePhotos = profileData.profilePhotos
    if (profileData.profilePhoto) updateData.profilePhoto = profileData.profilePhoto
    if (profileData.selfiePhoto) updateData.selfiePhoto = profileData.selfiePhoto

    const result = await db.collection('users').updateOne(
      { _id: new ObjectId(authResult.payload.userId) },
      { $set: updateData }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Registration completed successfully',
        redirectTo: '/dashboard-spa',
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[complete-registration] Error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to complete registration' },
      { status: 500 }
    )
  }
}
