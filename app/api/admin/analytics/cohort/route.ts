import { NextRequest, NextResponse } from 'next/server'
import { AnalyticsService } from '@/lib/services/analytics-service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { cohortStartDate, cohortEndDate, retentionPeriods } = body

    const results = await AnalyticsService.trackCohort({
      cohortStartDate: new Date(cohortStartDate),
      cohortEndDate: new Date(cohortEndDate),
      retentionPeriods,
    })

    return NextResponse.json(results)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
