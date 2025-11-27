import { NextRequest, NextResponse } from 'next/server'
import { AnalyticsService } from '@/lib/services/analytics-service'
import { performance } from 'perf_hooks'

export async function POST(request: NextRequest) {
  try {
    const start = performance.now()
    const body = await request.json()
    const { eventType, userId, properties, startDate, endDate, aggregation, property, groupBy } = body

    const results = await AnalyticsService.queryMetrics({
      eventType,
      userId,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      aggregation,
      property,
      groupBy,
    })
    const ms = Math.round(performance.now() - start)
    return NextResponse.json({ latencyMs: ms, results })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
