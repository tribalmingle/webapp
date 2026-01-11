import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db/mongodb'
import { getAuthUser } from '@/lib/auth/session'

/**
 * POST /api/onboarding/profile
 * Complete profile creation/update during onboarding
 * Handles full profile submission with all fields
 */
export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request)
    if (!authUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const {
      // Personal details
      name,
      dateOfBirth,
      gender,
      height,
      city,
      state,
      country,
      latitude,
      longitude,
      
      // Heritage & faith
      tribe,
      heritage,
      faith,
      
      // Bio & interests
      bio,
      interests,
      
      // Looking for
      lookingFor,
      ageRangeMin,
      ageRangeMax,
      maxDistance,
      
      // Photos
      photos,
      
      // Verification
      verificationSelfie,
      verificationIdUrl,
      
      // Completion status
      profileComplete
    } = body

    const db = await connectDB()
    const usersCollection = db.collection('users')

    // Prepare update document
    const updateDoc: any = {
      updatedAt: new Date()
    }

    // Add provided fields
    if (name !== undefined) updateDoc.name = name
    if (dateOfBirth !== undefined) updateDoc.dateOfBirth = new Date(dateOfBirth)
    if (gender !== undefined) updateDoc.gender = gender
    if (height !== undefined) updateDoc.height = height
    if (city !== undefined) updateDoc.city = city
    if (state !== undefined) updateDoc.state = state
    if (country !== undefined) updateDoc.country = country
    if (latitude !== undefined && longitude !== undefined) {
      updateDoc.location = {
        type: 'Point',
        coordinates: [longitude, latitude]
      }
    }
    
    if (tribe !== undefined) updateDoc.tribe = tribe
    if (heritage !== undefined) updateDoc.heritage = heritage
    if (faith !== undefined) updateDoc.faith = faith
    
    if (bio !== undefined) updateDoc.bio = bio
    if (interests !== undefined) updateDoc.interests = interests
    
    if (lookingFor !== undefined) updateDoc.lookingFor = lookingFor
    if (ageRangeMin !== undefined) updateDoc.ageRangeMin = ageRangeMin
    if (ageRangeMax !== undefined) updateDoc.ageRangeMax = ageRangeMax
    if (maxDistance !== undefined) updateDoc.maxDistance = maxDistance
    
    if (photos !== undefined) updateDoc.photos = photos
    
    if (verificationSelfie !== undefined) updateDoc.verificationSelfie = verificationSelfie
    if (verificationIdUrl !== undefined) updateDoc.verificationIdUrl = verificationIdUrl
    
    if (profileComplete !== undefined) {
      updateDoc.profileComplete = profileComplete
      if (profileComplete) {
        updateDoc.profileCompletedAt = new Date()
      }
    }

    // Update user profile
    const result = await usersCollection.findOneAndUpdate(
      { _id: authUser.userId },
      { $set: updateDoc },
      { returnDocument: 'after', upsert: false }
    )

    if (!result) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Return updated profile
    return NextResponse.json({
      success: true,
      profile: {
        id: result._id,
        name: result.name,
        dateOfBirth: result.dateOfBirth,
        gender: result.gender,
        height: result.height,
        city: result.city,
        state: result.state,
        country: result.country,
        tribe: result.tribe,
        heritage: result.heritage,
        faith: result.faith,
        bio: result.bio,
        interests: result.interests,
        lookingFor: result.lookingFor,
        ageRangeMin: result.ageRangeMin,
        ageRangeMax: result.ageRangeMax,
        maxDistance: result.maxDistance,
        photos: result.photos,
        verificationStatus: result.verificationStatus,
        profileComplete: result.profileComplete,
        profileCompletedAt: result.profileCompletedAt
      }
    })

  } catch (error: any) {
    console.error('[onboarding/profile] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/onboarding/profile
 * Retrieve current onboarding profile state
 */
export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request)
    if (!authUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const db = await connectDB()
    const usersCollection = db.collection('users')

    const user = await usersCollection.findOne({ _id: authUser.userId })
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      profile: {
        id: user._id,
        name: user.name,
        dateOfBirth: user.dateOfBirth,
        gender: user.gender,
        height: user.height,
        city: user.city,
        state: user.state,
        country: user.country,
        tribe: user.tribe,
        heritage: user.heritage,
        faith: user.faith,
        bio: user.bio,
        interests: user.interests,
        lookingFor: user.lookingFor,
        ageRangeMin: user.ageRangeMin,
        ageRangeMax: user.ageRangeMax,
        maxDistance: user.maxDistance,
        photos: user.photos,
        verificationStatus: user.verificationStatus,
        profileComplete: user.profileComplete,
        profileCompletedAt: user.profileCompletedAt
      }
    })

  } catch (error: any) {
    console.error('[onboarding/profile GET] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
