import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { getMongoDb } from '@/lib/mongodb'

export async function POST(request: NextRequest) {
  try {
    const db = await getMongoDb()
    const usersCollection = db.collection('users')

    // Check if test user already exists
    const existingUser = await usersCollection.findOne({ email: 'test@tribalmingle.com' })
    
    if (existingUser) {
      return NextResponse.json({
        success: true,
        message: 'Test user already exists',
        credentials: {
          email: 'test@tribalmingle.com',
          password: 'Test123!'
        }
      })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash('Test123!', 10)

    // Create test user
    const testUser = {
      name: 'John Doe',
      email: 'test@tribalmingle.com',
      password: hashedPassword,
      dateOfBirth: '1990-01-15',
      age: 34,
      gender: 'Male',
      tribe: 'Yoruba',
      country: 'Nigeria',
      city: 'Lagos',
      maritalStatus: 'Single',
      profilePhotos: [],
      subscriptionPlan: 'free',
      verified: false,
      bio: 'Test user account for Tribal Mingle platform',
      height: '6\'0"',
      bodyType: 'Athletic',
      education: 'Bachelor\'s Degree',
      occupation: 'Software Engineer',
      religion: 'Christian',
      lookingFor: 'Long-term relationship',
      interests: ['Travel', 'Music', 'Sports', 'Technology'],
      createdAt: new Date(),
      updatedAt: new Date()
    }

    await usersCollection.insertOne(testUser)

    return NextResponse.json({
      success: true,
      message: 'Test user created successfully',
      credentials: {
        email: 'test@tribalmingle.com',
        password: 'Test123!'
      }
    })
  } catch (error) {
    console.error('Error creating test user:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to create test user' },
      { status: 500 }
    )
  }
}
