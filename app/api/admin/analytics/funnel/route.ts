import { NextRequest, NextResponse } from 'next/server'
import { AnalyticsService } from '@/lib/services/analytics-service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { steps, startDate, endDate } = body

    const results = await AnalyticsService.analyzeFunnel({
      steps,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
    })

    return NextResponse.json(results)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
