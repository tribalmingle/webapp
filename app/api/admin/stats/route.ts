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
    const matchesCollection = db.collection('matches')
    const messagesCollection = db.collection('messages')
    const reportsCollection = db.collection('reports')

    // Get total users
    const totalUsers = await usersCollection.countDocuments()
    
    // Get active users (logged in within last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    const activeUsers = await usersCollection.countDocuments({
      lastActive: { $gte: sevenDaysAgo.toISOString() }
    })

    // Get new users today
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const newUsersToday = await usersCollection.countDocuments({
      createdAt: { $gte: today.toISOString() }
    })

    // Get premium vs free users
    const premiumUsers = await usersCollection.countDocuments({
      subscriptionPlan: { $ne: 'free' }
    })
    const freeUsers = totalUsers - premiumUsers

    // Get verified users
    const verifiedUsers = await usersCollection.countDocuments({ verified: true })
    
    // Get pending verifications
    const pendingVerifications = await usersCollection.countDocuments({
      verified: false,
      profilePhoto: { $exists: true, $ne: '' }
    })

    // Get total matches
    const totalMatches = await matchesCollection.countDocuments()

    // Get total messages
    const totalMessages = await messagesCollection.countDocuments()

    // Get reported profiles
    const reportedProfiles = await reportsCollection.countDocuments({ status: 'pending' })

    // Get blocked users
    const blockedUsers = await usersCollection.countDocuments({ status: 'banned' })

    // Calculate revenue (mock calculation - replace with actual transaction data)
    const monthlyRevenue = premiumUsers * 15 // Simplified calculation
    const totalRevenue = monthlyRevenue * 6 // Mock total revenue

    const stats = {
      totalUsers,
      activeUsers,
      newUsersToday,
      totalRevenue,
      monthlyRevenue,
      premiumUsers,
      freeUsers,
      verifiedUsers,
      pendingVerifications,
      totalMatches,
      totalMessages,
      reportedProfiles,
      blockedUsers
    }

    return NextResponse.json({ success: true, stats })
  } catch (error) {
    console.error('Error fetching admin stats:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch stats' },
      { status: 500 }
    )
  }
}
