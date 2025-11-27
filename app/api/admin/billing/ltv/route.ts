import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { getCollection } from '@/lib/db/mongodb'
import { COLLECTIONS } from '@/lib/db/collections'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const cohortMonths = parseInt(searchParams.get('cohortMonths') || '6')
    
    const subscriptions = await getCollection(COLLECTIONS.SUBSCRIPTIONS)
    const payments = await getCollection(COLLECTIONS.PAYMENTS)
    
    // Calculate LTV by cohort
    const cohortData = await subscriptions.aggregate([
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          users: { $sum: 1 },
          cohort: { $first: '$createdAt' },
        },
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: cohortMonths },
    ]).toArray()

    // Get payment data for each cohort
    const ltvData = await Promise.all(
      cohortData.map(async (cohort) => {
        const cohortStart = new Date(cohort.cohort)
        const cohortEnd = new Date(cohort.cohort)
        cohortEnd.setMonth(cohortEnd.getMonth() + 1)

        const cohortUsers = await subscriptions
          .find({
            createdAt: { $gte: cohortStart, $lt: cohortEnd },
          })
          .project({ userId: 1 })
          .toArray()

        const userIds = cohortUsers.map(u => u.userId)

        const revenue = await payments.aggregate([
          {
            $match: {
              userId: { $in: userIds },
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

        return {
          cohort: `${cohort._id.year}-${String(cohort._id.month).padStart(2, '0')}`,
          users: cohort.users,
          revenue: revenue[0]?.total || 0,
          ltv: cohort.users > 0 ? (revenue[0]?.total || 0) / cohort.users : 0,
        }
      })
    )

    return NextResponse.json(ltvData)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
