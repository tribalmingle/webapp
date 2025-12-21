import { NextRequest, NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    const client = await clientPromise
    const db = client.db(process.env.MONGODB_DB || 'tribalmingle')

    // Find users with incomplete registration
    const incompleteUsers = await db
      .collection('users')
      .find({ 
        $or: [
          { registrationComplete: false },
          { registrationComplete: { $exists: false } }
        ]
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray()

    // Get total count
    const totalCount = await db.collection('users').countDocuments({
      $or: [
        { registrationComplete: false },
        { registrationComplete: { $exists: false } }
      ]
    })

    // Remove passwords from response
    const sanitizedUsers = incompleteUsers.map(user => {
      const { password, resetToken, resetTokenExpiry, ...userWithoutSensitive } = user
      return userWithoutSensitive
    })

    return NextResponse.json(
      {
        success: true,
        users: sanitizedUsers,
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages: Math.ceil(totalCount / limit),
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[incomplete-registrations] Error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch incomplete registrations' },
      { status: 500 }
    )
  }
}
