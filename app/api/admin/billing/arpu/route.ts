import { NextRequest, NextResponse } from 'next/server'
import { getCollection } from '@/lib/db/mongodb'
import { COLLECTIONS } from '@/lib/db/collections'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const days = parseInt(searchParams.get('days') || '30')
    
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    
    const subscriptions = await getCollection(COLLECTIONS.SUBSCRIPTIONS)
    const payments = await getCollection(COLLECTIONS.PAYMENTS)
    
    // Calculate daily ARPU
    const arpuData = []
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      date.setHours(0, 0, 0, 0)
      
      const nextDate = new Date(date)
      nextDate.setDate(nextDate.getDate() + 1)
      
      // Count active users
      const activeUsers = await subscriptions.countDocuments({
        status: 'active',
        createdAt: { $lt: nextDate },
      })
      
      // Sum revenue for the day
      const dailyRevenue = await payments.aggregate([
        {
          $match: {
            createdAt: { $gte: date, $lt: nextDate },
            status: 'succeeded',
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' },
          },
        },
      ]).toArray()
      
      const revenue = dailyRevenue[0]?.total || 0
      const arpu = activeUsers > 0 ? revenue / activeUsers : 0
      
      arpuData.push({
        date: date.toISOString().split('T')[0],
        activeUsers,
        revenue,
        arpu,
      })
    }
    
    return NextResponse.json(arpuData)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
