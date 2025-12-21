import { NextResponse } from 'next/server'
import { getMongoDb } from '@/lib/mongodb'

export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * GET /api/marketing/recent-signups
 * Returns recent signups for social proof (anonymized)
 */
export async function GET() {
  try {
    const db = await getMongoDb()
    const users = db.collection('users')
    
    // Get last 10 signups from the last 24 hours
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    
    const recentUsers = await users
      .find({
        createdAt: { $gte: oneDayAgo },
        registrationComplete: true, // Only show completed registrations
      })
      .sort({ createdAt: -1 })
      .limit(10)
      .project({
        name: 1,
        country: 1,
        profilePicture: 1,
        createdAt: 1,
      })
      .toArray()

    // Format for display (anonymize for privacy)
    const signups = recentUsers.map((user) => {
      const firstName = user.name?.split(' ')[0] || 'Someone'
      
      return {
        id: user._id.toHexString(),
        firstName,
        location: user.country || 'Nigeria', // Default to Nigeria if not set
        profileImage: user.profilePicture || undefined,
        joinedAt: user.createdAt,
      }
    })

    return NextResponse.json({ signups })
  } catch (error) {
    console.error('[marketing] Failed to fetch recent signups:', error)
    return NextResponse.json({ signups: [] })
  }
}
