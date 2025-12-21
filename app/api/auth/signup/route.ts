import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import clientPromise from '@/lib/mongodb'
import { createToken } from '@/lib/auth'
import { User, AuthResponse } from '@/lib/types/user'
import { generateUniqueUsername, validateUsername, isUsernameAvailable } from '@/lib/utils/username'
import { sendWelcomeEmail } from '@/lib/vendors/resend-client'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
  const { email, password, name, age, gender, tribe, bio, interests, location, profilePhoto, selfiePhoto, username } = body

    // Validation
    if (!email || !password || !name || !age || !gender) {
      return NextResponse.json<AuthResponse>(
        {
          success: false,
          message: 'Missing required fields: email, password, name, age, gender',
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

    // Age validation
    if (age < 18) {
      return NextResponse.json<AuthResponse>(
        {
          success: false,
          message: 'You must be at least 18 years old',
        },
        { status: 400 }
      )
    }

    const client = await clientPromise
    const db = client.db(process.env.MONGODB_DB || 'tribalmingle')

    // Check if email exists in users collection
    const existingUser = await db.collection('users').findOne({ email: email.toLowerCase() })
    if (existingUser) {
      return NextResponse.json<AuthResponse>(
        {
          success: false,
          message: 'An account with this email already exists. Please log in instead.',
        },
        { status: 409 }
      )
    }

    // Check if email exists in applicants collection (partial registrations)
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

    // Handle username - validate if provided, or auto-generate
    let finalUsername: string
    
    if (username) {
      // Validate custom username
      const validation = validateUsername(username)
      if (!validation.valid) {
        return NextResponse.json<AuthResponse>(
          {
            success: false,
            message: validation.message || 'Invalid username',
          },
          { status: 400 }
        )
      }
      
      // Check if username is available
      const available = await isUsernameAvailable(username, db)
      if (!available) {
        return NextResponse.json<AuthResponse>(
          {
            success: false,
            message: 'Username already taken',
          },
          { status: 409 }
        )
      }
      
      finalUsername = username.toLowerCase()
    } else {
      // Auto-generate username from first name
      finalUsername = await generateUniqueUsername(name, db)
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user
    const newUser: User = {
      email: email.toLowerCase(),
      password: hashedPassword,
      name,
      username: finalUsername,
      age: parseInt(age),
      dateOfBirth: body.dateOfBirth || '',
      gender,
      tribe: tribe || '',
      bio: bio || '',
      interests: interests || [],
      location: location || '',
      city: body.city || '',
      country: body.country || '',
  maritalStatus: body.maritalStatus || '',
  // Use selfie as the initial primary profile image; store all in profilePhotos for consistency
  profilePhoto: selfiePhoto || profilePhoto || '',
  selfiePhoto: selfiePhoto || '',
  profilePhotos: selfiePhoto ? [selfiePhoto] : [],
      verified: false,
      registrationComplete: true, // Mark as complete - user finished all 7 steps
      registrationStep: 7, // Completed all steps
      subscriptionPlan: 'free',
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await db.collection('users').insertOne(newUser)

    // Send welcome email via Resend (async, don't wait for it)
    sendWelcomeEmail({
      to: newUser.email,
      name: newUser.name,
      verificationUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://tribalmingle.com'}/sign-up?step=verify`,
    }).catch((error) => {
      console.error('Failed to send welcome email:', error)
      // Don't fail signup if email fails
    })

    // Create JWT token
    const token = await createToken({
      userId: result.insertedId.toString(),
      email: newUser.email,
    })

    // Remove password from response
    const { password: _, ...userWithoutPassword } = newUser

    const response = NextResponse.json<AuthResponse>(
      {
        success: true,
        message: 'Account created successfully',
        user: {
          ...userWithoutPassword,
          _id: result.insertedId,
        },
        token,
      },
      { status: 201 }
    )

    // Set cookie - 2 hours of inactivity
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 2, // 2 hours
      path: '/',
    })

    return response
  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json<AuthResponse>(
      {
        success: false,
        message: 'Failed to create account',
      },
      { status: 500 }
    )
  }
}
