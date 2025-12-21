import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import clientPromise from '@/lib/mongodb'
import { createToken } from '@/lib/auth'
import { User, AuthResponse } from '@/lib/types/user'
import { generateUniqueUsername } from '@/lib/utils/username'

/**
 * Early registration endpoint - saves user after Step 1
 * This allows us to track incomplete registrations and send reminder emails
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, name, dateOfBirth } = body

    // Validation
    if (!email || !password || !name || !dateOfBirth) {
      return NextResponse.json<AuthResponse>(
        {
          success: false,
          message: 'Missing required fields: email, password, name, date of birth',
        },
        { status: 400 }
      )
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json<AuthResponse>(
        {
          success: false,
          message: 'Invalid email format',
        },
        { status: 400 }
      )
    }

    // Password validation
    if (password.length < 6) {
      return NextResponse.json<AuthResponse>(
        {
          success: false,
          message: 'Password must be at least 6 characters long',
        },
        { status: 400 }
      )
    }

    // Calculate age
    const birthDate = new Date(dateOfBirth)
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }

    if (age < 30) {
      return NextResponse.json<AuthResponse>(
        {
          success: false,
          message: 'You must be at least 30 years old',
        },
        { status: 400 }
      )
    }

    const client = await clientPromise
    const db = client.db(process.env.MONGODB_DB || 'tribalmingle')

    // Check if email exists in users collection
    const existingUser = await db.collection('users').findOne({ email: email.toLowerCase() })
    if (existingUser) {
      // If user exists, update their info and return token
      const isPasswordValid = await bcrypt.compare(password, existingUser.password)
      
      if (!isPasswordValid) {
        return NextResponse.json<AuthResponse>(
          {
            success: false,
            message: 'An account with this email already exists. Please log in instead.',
          },
          { status: 409 }
        )
      }

      // Password matches - update timestamp and return
      await db.collection('users').updateOne(
        { email: email.toLowerCase() },
        { $set: { updatedAt: new Date() } }
      )

      const token = await createToken({
        userId: existingUser._id.toString(),
        email: existingUser.email,
      })

      return NextResponse.json<AuthResponse>(
        {
          success: true,
          message: 'Continuing your registration',
          user: { ...existingUser, password: undefined } as any,
          token,
        },
        { status: 200 }
      )
    }

    // Check if email exists in applicants collection
    const existingApplicant = await db.collection('applicants').findOne({ email: email.toLowerCase() })
    if (existingApplicant) {
      return NextResponse.json<AuthResponse>(
        {
          success: false,
          message: 'An account with this email already exists. Please log in to continue your registration.',
        },
        { status: 409 }
      )
    }

    // Generate username
    const username = await generateUniqueUsername(name, db)

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create minimal user record
    const newUser: User = {
      email: email.toLowerCase(),
      password: hashedPassword,
      name,
      username,
      age,
      dateOfBirth,
      gender: 'male', // Default - will be updated in Step 2
      verified: false,
      registrationComplete: false,
      registrationStep: 1, // User completed Step 1
      registrationReminderSent: false,
      subscriptionPlan: 'free',
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await db.collection('users').insertOne(newUser)

    // Create JWT token
    const token = await createToken({
      userId: result.insertedId.toString(),
      email: newUser.email,
    })

    // Remove password from response
    const { password: _, ...userWithoutPassword } = newUser

    console.log('[early-register] User created at Step 1:', email)

    return NextResponse.json<AuthResponse>(
      {
        success: true,
        message: 'Account created - continue registration',
        user: {
          ...userWithoutPassword,
          _id: result.insertedId,
        },
        token,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('[early-register] Error:', error)
    return NextResponse.json<AuthResponse>(
      {
        success: false,
        message: 'Failed to save registration',
      },
      { status: 500 }
    )
  }
}
