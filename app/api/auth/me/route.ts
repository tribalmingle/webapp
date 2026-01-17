import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, createToken } from '@/lib/auth'
import { connectDB } from '@/lib/db/mongodb'
import { ObjectId } from 'mongodb'

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Not authenticated' },
        { status: 401 }
      )
    }

    const db = await connectDB()

    const userData = await db.collection('users').findOne(
      { _id: new ObjectId(user.userId) },
      { projection: { password: 0 } }
    )

    if (!userData) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      )
    }

    // Convert to plain object and add name field
    const plainUser = JSON.parse(JSON.stringify(userData));
    const name = [plainUser.firstName, plainUser.lastName].filter(Boolean).join(' ') || plainUser.email?.split('@')[0] || 'User';

    // Refresh the session token on each request to extend the 2-hour window
    const newToken = await createToken({
      userId: user.userId,
      email: userData.email,
    })

    const response = NextResponse.json({
      success: true,
      user: {
        ...plainUser,
        name,
        id: plainUser._id,
      },
    })

    // Extend session cookie - 2 hours from now
    response.cookies.set('auth-token', newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 2, // 2 hours
      path: '/',
    })

    return response
  } catch (error) {
    console.error('Get user error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to get user data' },
      { status: 500 }
    )
  }
}
