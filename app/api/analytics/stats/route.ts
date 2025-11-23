/**
 * Phase 6: Analytics Dashboard Stats API
 * Aggregates active users, event counts, and default funnel for admin dashboard
 */

import { NextRequest, NextResponse } from 'next/server'
import { AnalyticsService } from '@/lib/services/analytics-service'
import { withSpan } from '@/lib/observability/tracing'

export async function GET(request: NextRequest) {
  return withSpan('api.analytics.stats', async () => {
    try {
      // Default time window: last 7 days
      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - 7)

      // Get active users (last 5 minutes)
      const activeUsers = await AnalyticsService.getActiveUsers(5)

      // Get event counts
      const eventCounts = await AnalyticsService.getEventCounts(startDate, endDate)

      // Default onboarding funnel
      const funnelSteps = [
        'user.signup',
        'profile.completed',
        'discovery.first_swipe',
        'match.confirmed',
        'chat.sent'
      ]
      const funnelData = await AnalyticsService.getFunnelData(funnelSteps, startDate, endDate)

      return NextResponse.json({
        success: true,
        data: {
          activeUsers,
          eventCounts,
          funnel: funnelData,
          timeRange: {
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
          }
        }
      })
    } catch (error: any) {
      console.error('[Analytics Stats API] Error:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }
  })
}
