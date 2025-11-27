/**
 * SLO Status API Route
 * Returns current status of all platform SLOs
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/middleware/rbac'
import { getAllSLOStatuses } from '@/lib/services/slo-service'

export async function GET(request: NextRequest) {
  // Require admin access
  const authCheck = await requireAdmin(request)
  if (authCheck.error) return authCheck.error
  
  try {
    const slos = await getAllSLOStatuses()
    
    return NextResponse.json({
      slos,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Failed to fetch SLO statuses:', error)
    return NextResponse.json(
      { error: 'Failed to fetch SLO statuses' },
      { status: 500 }
    )
  }
}
