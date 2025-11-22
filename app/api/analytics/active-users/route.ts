/**
 * Active Users API
 * GET /api/analytics/active-users - Get count of active users in last N minutes
 */

import { NextRequest, NextResponse } from 'next/server'
import { AnalyticsService } from '@/lib/services/analytics-service'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const timeWindow = Number(searchParams.get('minutes')) || 5

    const count = await AnalyticsService.getActiveUsers(timeWindow)

    return NextResponse.json({
      success: true,
      count,
      timeWindow,
    })
  } catch (error) {
    console.error('Error fetching active users:', error)
    return NextResponse.json(
      { error: 'Failed to fetch active users' },
      { status: 500 }
    )
  }
}
