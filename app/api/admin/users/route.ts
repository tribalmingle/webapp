import { NextRequest, NextResponse } from 'next/server'
import { ensureAdminRequest } from '@/lib/admin/auth'
import { getMongoDb } from '@/lib/mongodb'

export async function GET(req: NextRequest) {
  const auth = ensureAdminRequest(req)
  if ('response' in auth) {
    return auth.response
  }

  try {
    const db = await getMongoDb()
    const usersCollection = db.collection('users')

    // Get all users with relevant data
    const users = await usersCollection
      .find({})
      .project({
        password: 0, // Exclude password
        selfiePhoto: 0 // Exclude selfie for privacy
      })
      .sort({ createdAt: -1 })
      .limit(1000)
      .toArray()

    // Add calculated fields
    const enrichedUsers = users.map((user: any) => ({
      ...user,
      _id: user._id.toString(),
      totalMatches: 0, // TODO: Calculate from matches collection
      totalMessages: 0, // TODO: Calculate from messages collection
      reportCount: 0, // TODO: Calculate from reports collection
      status: user.status || 'active'
    }))

    return NextResponse.json({ success: true, users: enrichedUsers })
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}
