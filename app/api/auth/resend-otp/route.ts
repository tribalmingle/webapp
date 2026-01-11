import { NextRequest, NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { AuthResponse } from '@/lib/types/user'
import { sendVerificationCodeEmail } from '@/lib/vendors/resend-client'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    // Validation
    if (!email) {
      return NextResponse.json<AuthResponse>(
        {
          success: false,
          message: 'Email is required',
        },
        { status: 400 }
      )
    }

    const client = await clientPromise
    const db = client.db(process.env.MONGODB_DB || 'tribalmingle')

    // Check if user exists
    const user = await db.collection('users').findOne({ 
      email: email.toLowerCase() 
    })

    if (!user) {
      return NextResponse.json<AuthResponse>(
        {
          success: false,
          message: 'User not found',
        },
        { status: 404 }
      )
    }

    // Delete any existing OTP for this email
    await db.collection('otps').deleteMany({ 
      email: email.toLowerCase() 
    })

    // Generate new 6-digit OTP code
    const otp = Math.floor(100000 + Math.random() * 900000).toString()

    // Store OTP in database with 10-minute expiration
    await db.collection('otps').insertOne({
      email: email.toLowerCase(),
      code: otp,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
      createdAt: new Date(),
    })

    // Send verification code email
    try {
      await sendVerificationCodeEmail({
        to: email,
        name: user.name,
        code: otp,
      })
    } catch (error) {
      console.error('Failed to send verification code email:', error)
      return NextResponse.json<AuthResponse>(
        {
          success: false,
          message: 'Failed to send verification email. Please try again.',
        },
        { status: 500 }
      )
    }

    return NextResponse.json<AuthResponse>(
      {
        success: true,
        message: 'Verification code sent successfully',
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Resend OTP error:', error)
    return NextResponse.json<AuthResponse>(
      {
        success: false,
        message: 'Failed to resend verification code',
      },
      { status: 500 }
    )
  }
}
