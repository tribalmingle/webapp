import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { connectDB } from '@/lib/db/mongodb'
import { getAuthUser } from '@/lib/auth/session'

/**
 * GET /api/referrals/code
 * Get user's referral code and share URL
 */
export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request)
    if (!authUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const db = await connectDB()
    const usersCollection = db.collection('users')

    const user = await usersCollection.findOne({ _id: new ObjectId(authUser.userId) })
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Generate referral code if not exists
    let referralCode = user.referralCode
    if (!referralCode) {
      // Generate unique code: first 3 letters of name + 6 random chars
      const namePart = (user.name || 'USER').substring(0, 3).toUpperCase()
      const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase()
      referralCode = `${namePart}${randomPart}`

      // Update user with new code
      await usersCollection.updateOne(
        { _id: new ObjectId(authUser.userId) },
        { $set: { referralCode, referralCodeCreatedAt: new Date() } }
      )
    }

    // Build share URL
    const shareUrl = `https://tribalmingle.com/signup?ref=${referralCode}`

    return NextResponse.json({
      code: referralCode,
      shareUrl,
      message: 'Share your code and earn rewards when friends sign up!'
    })

  } catch (error: any) {
    console.error('[referrals/code] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
