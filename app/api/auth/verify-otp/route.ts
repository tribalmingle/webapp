import { NextRequest, NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { AuthResponse } from '@/lib/types/user'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, code } = body

    // Validation
    if (!email || !code) {
      return NextResponse.json<AuthResponse>(
        {
          success: false,
          message: 'Email and verification code are required',
        },
        { status: 400 }
      )
    }

    const client = await clientPromise
    const db = client.db(process.env.MONGODB_DB || 'tribalmingle')

    // Find OTP record
    const otpRecord = await db.collection('otps').findOne({
      email: email.toLowerCase(),
      code: code.toString(),
    })

    if (!otpRecord) {
      return NextResponse.json<AuthResponse>(
        {
          success: false,
          message: 'Invalid verification code. Please check and try again.',
        },
        { status: 400 }
      )
    }

    // Check if code has expired
    if (new Date() > otpRecord.expiresAt) {
      // Delete expired OTP
      await db.collection('otps').deleteOne({ _id: otpRecord._id })
      
      return NextResponse.json<AuthResponse>(
        {
          success: false,
          message: 'Verification code has expired. Please request a new one.',
        },
        { status: 400 }
      )
    }

    // Update user verification status
    const updateResult = await db.collection('users').updateOne(
      { email: email.toLowerCase() },
      {
        $set: {
          verified: true,
          updatedAt: new Date(),
        },
      }
    )

    if (updateResult.matchedCount === 0) {
      return NextResponse.json<AuthResponse>(
        {
          success: false,
          message: 'User not found',
        },
        { status: 404 }
      )
    }

    // Delete used OTP
    await db.collection('otps').deleteOne({ _id: otpRecord._id })

    return NextResponse.json<AuthResponse>(
      {
        success: true,
        message: 'Email verified successfully',
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('OTP verification error:', error)
    return NextResponse.json<AuthResponse>(
      {
        success: false,
        message: 'Failed to verify code',
      },
      { status: 500 }
    )
  }
}
