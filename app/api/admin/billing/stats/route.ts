import { NextResponse } from 'next/server'
import { getCollection } from '@/lib/db/mongodb'

interface SubscriptionStats {
  mrr: number // Monthly Recurring Revenue in cents
  activeSubscriptions: {
    free: number
    concierge: number
    guardian: number
    premium_plus: number
  }
  trialConversions: {
    total: number
    converted: number
    conversionRate: number
  }
  churnRate: number
  revenueCohorts: Array<{
    month: string
    revenue: number
    newSubscribers: number
  }>
}

export async function GET() {
  try {
    const collection = await getCollection<any>('subscriptions')
    const now = new Date()
    
    // Active subscriptions by plan
    const activePipeline = [
      {
        $match: { status: { $in: ['active', 'trialing'] } }
      },
      {
        $group: {
          _id: '$plan',
          count: { $sum: 1 }
        }
      }
    ]
    
    const activeResults = await collection.aggregate(activePipeline).toArray()
    const activeSubscriptions = {
      free: 0,
      concierge: 0,
      guardian: 0,
      premium_plus: 0,
    }
    
    activeResults.forEach((r: any) => {
      if (r._id in activeSubscriptions) {
        activeSubscriptions[r._id as keyof typeof activeSubscriptions] = r.count
      }
    })
    
    // Calculate MRR (simple pricing model)
    const priceMap: Record<string, number> = {
      free: 0,
      concierge: 1000, // $10/mo in cents
      guardian: 2000,  // $20/mo
      premium_plus: 3000, // $30/mo
    }
    
    const mrr = Object.entries(activeSubscriptions).reduce((sum, [plan, count]) => {
      return sum + (priceMap[plan] || 0) * count
    }, 0)
    
    // Trial conversions (last 30 days)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const trials = await collection.countDocuments({
      status: 'trialing',
      createdAt: { $gte: thirtyDaysAgo }
    })
    
    const converted = await collection.countDocuments({
      status: 'active',
      trialEndsAt: { $exists: true, $ne: null },
      updatedAt: { $gte: thirtyDaysAgo }
    })
    
    const trialConversions = {
      total: trials + converted,
      converted,
      conversionRate: trials + converted > 0 ? (converted / (trials + converted)) * 100 : 0
    }
    
    // Churn rate (canceled in last 30 days vs active start of month)
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const activeStartOfMonth = await collection.countDocuments({
      status: 'active',
      createdAt: { $lt: monthAgo }
    })
    
    const churned = await collection.countDocuments({
      status: 'canceled',
      updatedAt: { $gte: monthAgo, $lt: now }
    })
    
    const churnRate = activeStartOfMonth > 0 ? (churned / activeStartOfMonth) * 100 : 0
    
    // Revenue cohorts (last 6 months)
    const cohorts: Array<{ month: string; revenue: number; newSubscribers: number }> = []
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0)
      const monthLabel = monthStart.toLocaleDateString('en-US', { year: 'numeric', month: 'short' })
      
      const newSubs = await collection.countDocuments({
        status: { $in: ['active', 'trialing'] },
        createdAt: { $gte: monthStart, $lte: monthEnd }
      })
      
      const activePlans = await collection.aggregate([
        {
          $match: {
            status: 'active',
            createdAt: { $lte: monthEnd }
          }
        },
        {
          $group: {
            _id: '$plan',
            count: { $sum: 1 }
          }
        }
      ]).toArray()
      
      const revenue = activePlans.reduce((sum: number, p: any) => {
        return sum + (priceMap[p._id] || 0) * p.count
      }, 0)
      
      cohorts.push({
        month: monthLabel,
        revenue,
        newSubscribers: newSubs
      })
    }
    
    const stats: SubscriptionStats = {
      mrr,
      activeSubscriptions,
      trialConversions,
      churnRate,
      revenueCohorts: cohorts
    }
    
    return NextResponse.json(stats)
  } catch (error) {
    console.error('Billing stats error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch billing stats' },
      { status: 500 }
    )
  }
}
