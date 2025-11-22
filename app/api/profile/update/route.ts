import { NextRequest, NextResponse } from 'next/server'
import { getMongoDb } from '@/lib/mongodb'
import { getCurrentUser } from '@/lib/auth'

export async function PUT(req: NextRequest) {
  try {
    const userPayload = await getCurrentUser()
    
    if (!userPayload) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const {
      name,
      bio,
      dateOfBirth,
      gender,
      tribe,
      country,
      city,
      maritalStatus,
      height,
      bodyType,
      education,
      occupation,
      religion,
      lookingFor,
      interests,
  profilePhotos
    } = body

    // Calculate age from date of birth
    let age: number | undefined
    if (dateOfBirth) {
      const birthDate = new Date(dateOfBirth)
      const today = new Date()
      age = today.getFullYear() - birthDate.getFullYear()
      const monthDiff = today.getMonth() - birthDate.getMonth()
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--
      }
    }

    const db = await getMongoDb()
    const usersCollection = db.collection('users')

    const updateData: any = {
      updatedAt: new Date()
    }

    // Only update fields that are provided
    if (name !== undefined) updateData.name = name
    if (bio !== undefined) updateData.bio = bio
    if (dateOfBirth !== undefined) {
      updateData.dateOfBirth = dateOfBirth
      updateData.age = age
    }
    if (gender !== undefined) updateData.gender = gender
    if (tribe !== undefined) updateData.tribe = tribe
    if (country !== undefined) updateData.country = country
    if (city !== undefined) updateData.city = city
    if (maritalStatus !== undefined) updateData.maritalStatus = maritalStatus
    if (height !== undefined) updateData.height = height
    if (bodyType !== undefined) updateData.bodyType = bodyType
    if (education !== undefined) updateData.education = education
    if (occupation !== undefined) updateData.occupation = occupation
    if (religion !== undefined) updateData.religion = religion
    if (lookingFor !== undefined) updateData.lookingFor = lookingFor
    if (interests !== undefined) updateData.interests = interests
    if (profilePhotos !== undefined) updateData.profilePhotos = profilePhotos
    // Keep a primary profilePhoto field in sync with the first photo if present
    if (Array.isArray(profilePhotos) && profilePhotos.length > 0) {
      updateData.profilePhoto = profilePhotos[0]
    }

    const result = await usersCollection.updateOne(
      { email: userPayload.email },
      { $set: updateData }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      )
    }

    // Fetch updated user
    const updatedUser = await usersCollection.findOne({ email: userPayload.email })
    if (!updatedUser) {
      return NextResponse.json(
        { success: false, message: 'Error fetching updated user' },
        { status: 500 }
      )
    }

    // Remove password from response
    const { password, ...userWithoutPassword } = updatedUser

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      user: userWithoutPassword
    })
  } catch (error) {
    console.error('Profile update error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
