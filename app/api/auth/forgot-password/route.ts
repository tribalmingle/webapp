import { NextRequest, NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { sendPasswordResetEmail } from '@/lib/vendors/resend-client'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json(
        { success: false, message: 'Email is required' },
        { status: 400 }
      )
    }

    const client = await clientPromise
    const db = client.db(process.env.MONGODB_DB || 'tribalmingle')

    // Find user
    const user = await db.collection('users').findOne({ email: email.toLowerCase() })

    // Always return success to prevent email enumeration
    if (!user) {
      return NextResponse.json(
        { success: true, message: 'If an account exists with this email, a password reset link has been sent.' },
        { status: 200 }
      )
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex')
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    // Store token in database
    await db.collection('users').updateOne(
      { email: email.toLowerCase() },
      {
        $set: {
          resetToken,
          resetTokenExpiry,
          updatedAt: new Date(),
        },
      }
    )

    // Send reset email
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://tribalmingle.com'}/reset-password?token=${resetToken}`
    
    await sendPasswordResetEmail({
      to: email,
      name: user.name,
      resetUrl,
    })

    return NextResponse.json(
      { success: true, message: 'If an account exists with this email, a password reset link has been sent.' },
      { status: 200 }
    )
  } catch (error) {
    console.error('[forgot-password] Error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to process password reset request' },
      { status: 500 }
    )
  }
}
