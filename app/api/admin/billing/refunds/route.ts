import { NextRequest, NextResponse } from 'next/server'
import { getCollection } from '@/lib/db/mongodb'
import { COLLECTIONS } from '@/lib/db/collections'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const days = parseInt(searchParams.get('days') || '30')
    
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    
    const payments = await getCollection(COLLECTIONS.PAYMENTS)
    
    // Get refund statistics
    const refundStats = await payments.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          status: { $in: ['succeeded', 'refunded'] },
        },
      },
      {
        $group: {
          _id: null,
          totalPayments: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
          refundedCount: {
            $sum: { $cond: [{ $eq: ['$status', 'refunded'] }, 1, 0] },
          },
          refundedAmount: {
            $sum: { $cond: [{ $eq: ['$status', 'refunded'] }, '$amount', 0] },
          },
        },
      },
    ]).toArray()

    const stats = refundStats[0] || {
      totalPayments: 0,
      totalAmount: 0,
      refundedCount: 0,
      refundedAmount: 0,
    }

    const refundRate = stats.totalPayments > 0 
      ? (stats.refundedCount / stats.totalPayments) * 100 
      : 0

    // Get refunds with reasons
    const refunds = await payments.aggregate([
      {
        $match: {
          status: 'refunded',
          createdAt: { $gte: startDate },
        },
      },
      {
        $lookup: {
          from: COLLECTIONS.USERS,
          localField: 'userId',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          amount: 1,
          refundReason: 1,
          createdAt: 1,
          user: {
            _id: 1,
            name: 1,
            email: 1,
          },
        },
      },
      { $sort: { createdAt: -1 } },
      { $limit: 50 },
    ]).toArray()

    return NextResponse.json({
      stats: {
        totalPayments: stats.totalPayments,
        totalAmount: stats.totalAmount,
        refundedCount: stats.refundedCount,
        refundedAmount: stats.refundedAmount,
        refundRate,
      },
      refunds,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
