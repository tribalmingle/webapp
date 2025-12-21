import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import clientPromise from '@/lib/mongodb'
import { createToken } from '@/lib/auth'
import { AuthResponse } from '@/lib/types/user'

export async function POST(request: NextRequest) {
  console.log('[signin] Starting signin request')
  try {
    const body = await request.json()
    const { email, password } = body
    console.log('[signin] Email:', email)

    // Validation
    if (!email || !password) {
      console.log('[signin] Validation failed: missing email or password')
      return NextResponse.json<AuthResponse>(
        {
          success: false,
          message: 'Email and password are required',
        },
        { status: 400 }
      )
    }

    console.log('[signin] Connecting to MongoDB...')
    const client = await clientPromise
    const db = client.db(process.env.MONGODB_DB || 'tribalmingle')
    console.log('[signin] MongoDB connected, database:', db.databaseName)

    // Find user
    console.log('[signin] Finding user...')
    const user = await db.collection('users').findOne({ email: email.toLowerCase() })
    
    if (!user) {
      console.log('[signin] User not found:', email)
      return NextResponse.json<AuthResponse>(
        {
          success: false,
          message: 'Invalid email or password',
        },
        { status: 401 }
      )
    }

    console.log('[signin] User found:', user._id.toString())

    // Verify password
    console.log('[signin] Verifying password...')
    const isPasswordValid = await bcrypt.compare(password, user.password)
    console.log('[signin] Password valid:', isPasswordValid)
    
    if (!isPasswordValid) {
      console.log('[signin] Invalid password for user:', email)
      return NextResponse.json<AuthResponse>(
        {
          success: false,
          message: 'Invalid email or password',
        },
        { status: 401 }
      )
    }

    // Create JWT token
    console.log('[signin] Creating JWT token...')
    console.log('[signin] JWT_SECRET exists:', !!process.env.JWT_SECRET)
    const token = await createToken({
      userId: user._id.toString(),
      email: user.email,
    })
    console.log('[signin] Token created successfully')

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user

    const response = NextResponse.json<AuthResponse>(
      {
        success: true,
        message: 'Login successful',
        user: userWithoutPassword as any,
        token,
        redirectTo: user.registrationComplete ? '/dashboard-spa' : '/sign-up?step=continue', // Redirect incomplete users
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

    console.log('[signin] Login successful for:', email)
    return response
  } catch (error: any) {
    console.error('Signin error:', error)
    console.error('Error stack:', error.stack)
    console.error('Error details:', {
      message: error.message,
      name: error.name,
      hasJwtSecret: !!process.env.JWT_SECRET,
      hasMongoDB: !!process.env.MONGODB_URI,
    })
    return NextResponse.json<AuthResponse>(
      {
        success: false,
        message: `Failed to sign in: ${error.message || 'Unknown error'}`,
      },
      { status: 500 }
    )
  }
}
