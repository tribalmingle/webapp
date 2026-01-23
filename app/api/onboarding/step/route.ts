import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { connectDB } from '@/lib/db/mongodb'
import { getAuthUser } from '@/lib/auth/session'

/**
 * POST /api/onboarding/step
 * Step-wise profile persistence during 13-step onboarding flow
 * Validates and saves data for a specific step
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
    const { step, data } = body

    if (step === undefined || step === null) {
      return NextResponse.json(
        { error: 'Step number required' },
        { status: 400 }
      )
    }

    if (!data || typeof data !== 'object') {
      return NextResponse.json(
        { error: 'Step data required' },
        { status: 400 }
      )
    }

    const db = await connectDB()
    const usersCollection = db.collection('users')

    // Step-specific validation and field mapping
    let updateDoc: any = {
      updatedAt: new Date(),
      [`onboarding.step${step}`]: data,
      'onboarding.lastCompletedStep': step
    }

    // Map step data to user fields based on step number
    switch (step) {
      case 1: // Personal Details (name, dob, gender)
        if (data.name) updateDoc.name = data.name
        if (data.dateOfBirth) updateDoc.dateOfBirth = new Date(data.dateOfBirth)
        if (data.gender) updateDoc.gender = data.gender
        if (data.height) updateDoc.height = data.height
        break

      case 2: // Heritage
        if (data.tribe) updateDoc.tribe = data.tribe
        if (data.heritage) updateDoc.heritage = data.heritage
        break

      case 3: // Faith
        if (data.faith) updateDoc.faith = data.faith
        break

      case 4: // Location
        if (data.city) updateDoc.city = data.city
        if (data.state) updateDoc.state = data.state
        if (data.country) updateDoc.country = data.country
        if (data.latitude !== undefined && data.longitude !== undefined) {
          updateDoc.location = {
            type: 'Point',
            coordinates: [data.longitude, data.latitude]
          }
        }
        break

      case 5: // Bio
        if (data.bio) updateDoc.bio = data.bio
        break

      case 6: // Interests
        if (data.interests) updateDoc.interests = data.interests
        if (data.loveLanguage) updateDoc.loveLanguage = data.loveLanguage
        break

      case 7: // Looking For
        if (data.lookingFor) updateDoc.lookingFor = data.lookingFor
        if (data.ageRangeMin !== undefined) updateDoc.ageRangeMin = data.ageRangeMin
        if (data.ageRangeMax !== undefined) updateDoc.ageRangeMax = data.ageRangeMax
        if (data.maxDistance !== undefined) updateDoc.maxDistance = data.maxDistance
        break

      case 8: // Photo Upload
        if (data.photos) updateDoc.photos = data.photos
        break

      case 9: // Selfie Verification
        if (data.verificationSelfie) updateDoc.verificationSelfie = data.verificationSelfie
        break

      case 10: // ID Verification
        if (data.verificationIdUrl) updateDoc.verificationIdUrl = data.verificationIdUrl
        if (data.verificationStatus) updateDoc.verificationStatus = data.verificationStatus
        break

      case 11: // Additional preferences (if any)
        if (data.preferences) {
          Object.keys(data.preferences).forEach(key => {
            updateDoc[`preferences.${key}`] = data.preferences[key]
          })
        }
        break

      case 12: // Review/Confirm
        // No additional fields, just confirmation
        break

      case 13: // Final completion
        updateDoc.profileComplete = true
        updateDoc.profileCompletedAt = new Date()
        updateDoc['onboarding.completed'] = true
        updateDoc['onboarding.completedAt'] = new Date()
        break

      default:
        // Generic step handling - just store the data
        break
    }

    // Validate required fields per step (basic validation)
    const validationError = validateStepData(step, data)
    if (validationError) {
      return NextResponse.json(
        { error: validationError },
        { status: 400 }
      )
    }

    // Update user profile with step data
    const result = await usersCollection.findOneAndUpdate(
      { _id: new ObjectId(authUser.userId) },
      { $set: updateDoc },
      { returnDocument: 'after', upsert: false }
    )

    if (!result) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Return success with current step status
    return NextResponse.json({
      success: true,
      step,
      completed: true,
      nextStep: step < 13 ? step + 1 : null,
      profileComplete: result.profileComplete || false,
      profile: {
        id: result._id,
        name: result.name,
        onboarding: result.onboarding
      }
    })

  } catch (error: any) {
    console.error('[onboarding/step] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Validate step-specific data
 */
function validateStepData(step: number, data: any): string | null {
  switch (step) {
    case 1: // Personal Details
      if (!data.name || data.name.trim().length < 2) {
        return 'Name must be at least 2 characters'
      }
      if (!data.dateOfBirth) {
        return 'Date of birth is required'
      }
      if (!data.gender) {
        return 'Gender is required'
      }
      // Age validation
      const age = Math.floor((Date.now() - new Date(data.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
      if (age < 18) {
        return 'You must be at least 18 years old'
      }
      if (age > 100) {
        return 'Please enter a valid date of birth'
      }
      break

    case 2: // Heritage
      if (!data.tribe) {
        return 'Tribe selection is required'
      }
      break

    case 3: // Faith
      if (!data.faith) {
        return 'Faith selection is required'
      }
      break

    case 4: // Location
      if (!data.city || !data.country) {
        return 'City and country are required'
      }
      break

    case 5: // Bio
      if (!data.bio || data.bio.trim().length < 20) {
        return 'Bio must be at least 20 characters'
      }
      if (data.bio.length > 500) {
        return 'Bio must be less than 500 characters'
      }
      break

    case 6: // Interests
      if (!data.interests || !Array.isArray(data.interests) || data.interests.length < 3) {
        return 'Please select at least 3 interests'
      }
      if (!data.loveLanguage) {
        return 'Please select a love language'
      }
      break

    case 7: // Looking For
      if (!data.lookingFor) {
        return 'Please specify what you are looking for'
      }
      if (data.ageRangeMin !== undefined && data.ageRangeMax !== undefined) {
        if (data.ageRangeMin < 18 || data.ageRangeMax > 100) {
          return 'Age range must be between 18 and 100'
        }
        if (data.ageRangeMin > data.ageRangeMax) {
          return 'Minimum age cannot be greater than maximum age'
        }
      }
      break

    case 8: // Photo Upload
      if (!data.photos || !Array.isArray(data.photos) || data.photos.length < 2) {
        return 'Please upload at least 2 photos'
      }
      break

    case 9: // Selfie Verification
      if (!data.verificationSelfie) {
        return 'Selfie verification is required'
      }
      break

    case 10: // ID Verification
      if (!data.verificationIdUrl) {
        return 'ID verification is required'
      }
      break
  }

  return null
}

/**
 * GET /api/onboarding/step
 * Retrieve current onboarding step progress
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

    const user = await usersCollection.findOne({ _id: new ObjectId(authUser.userId) })
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      currentStep: user.onboarding?.lastCompletedStep ? user.onboarding.lastCompletedStep + 1 : 1,
      lastCompletedStep: user.onboarding?.lastCompletedStep || 0,
      completed: user.onboarding?.completed || false,
      profileComplete: user.profileComplete || false,
      stepData: user.onboarding || {}
    })

  } catch (error: any) {
    console.error('[onboarding/step GET] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
