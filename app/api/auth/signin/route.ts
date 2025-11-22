import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import clientPromise from '@/lib/mongodb'
import { createToken } from '@/lib/auth'
import { AuthResponse } from '@/lib/types/user'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    // Validation
    if (!email || !password) {
      return NextResponse.json<AuthResponse>(
        {
          success: false,
          message: 'Email and password are required',
        },
        { status: 400 }
      )
    }

    const client = await clientPromise
    const db = client.db(process.env.MONGODB_DB || 'tribalmingle')

    // Find user
    const user = await db.collection('users').findOne({ email: email.toLowerCase() })
    
    if (!user) {
      return NextResponse.json<AuthResponse>(
        {
          success: false,
          message: 'Invalid email or password',
        },
        { status: 401 }
      )
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password)
    
    if (!isPasswordValid) {
      return NextResponse.json<AuthResponse>(
        {
          success: false,
          message: 'Invalid email or password',
        },
        { status: 401 }
      )
    }

    // Create JWT token
    const token = await createToken({
      userId: user._id.toString(),
      email: user.email,
    })

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user

    const response = NextResponse.json<AuthResponse>(
      {
        success: true,
        message: 'Login successful',
        user: userWithoutPassword as any,
        token,
      },
      { status: 200 }
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
    console.error('Signin error:', error)
    return NextResponse.json<AuthResponse>(
      {
        success: false,
        message: 'Failed to sign in',
      },
      { status: 500 }
    )
  }
}
