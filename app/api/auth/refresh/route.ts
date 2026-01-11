import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db/mongodb'

/**
 * POST /api/auth/refresh
 * Mobile token refresh endpoint - exchanges refresh token for new access token
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { refreshToken } = body

    if (!refreshToken) {
      return NextResponse.json(
        { error: 'Refresh token required' },
        { status: 400 }
      )
    }

    const db = await connectDB()
    const refreshTokensCollection = db.collection('refresh_tokens')
    const usersCollection = db.collection('users')

    // Find refresh token in database
    const tokenDoc = await refreshTokensCollection.findOne({
      token: refreshToken,
      expiresAt: { $gt: new Date() },
      revoked: { $ne: true }
    })

    if (!tokenDoc) {
      return NextResponse.json(
        { error: 'Invalid or expired refresh token' },
        { status: 401 }
      )
    }

    // Get user
    const user = await usersCollection.findOne({ _id: tokenDoc.userId })
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 401 }
      )
    }

    // Check if user is active
    if (user.status === 'suspended' || user.status === 'deleted') {
      return NextResponse.json(
        { error: 'Account not active' },
        { status: 403 }
      )
    }

    // Generate new access token (JWT in production, demo token for now)
    const newAccessToken = `demo:${user._id}:${user.name || 'User'}`

    // Optional: rotate refresh token for enhanced security
    // For now, we'll keep the same refresh token valid

    // Update last used timestamp
    await refreshTokensCollection.updateOne(
      { _id: tokenDoc._id },
      { 
        $set: { lastUsedAt: new Date() },
        $inc: { useCount: 1 }
      }
    )

    return NextResponse.json({
      accessToken: newAccessToken,
      refreshToken: refreshToken,
      expiresIn: 3600, // 1 hour in seconds
      tokenType: 'Bearer',
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        isPremium: user.isPremium || false
      }
    })

  } catch (error: any) {
    console.error('[auth/refresh] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
