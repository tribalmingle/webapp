/**
 * Admin Performance Metrics API
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/middleware/rbac'
import { getPerformanceMetrics } from '@/lib/services/performance-service'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const authCheck = await requireAdmin(request)
  if (authCheck.error) return authCheck.error

  try {
    const metrics = await getPerformanceMetrics()
    return NextResponse.json({
      metrics,
      generatedAt: metrics.generatedAt,
    })
  } catch (error) {
    console.error('Failed to fetch performance metrics:', error)
    return NextResponse.json({ error: 'Failed to fetch performance metrics' }, { status: 500 })
  }
}
