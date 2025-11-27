/**
 * API: Get queue metrics
 */

import { NextResponse } from 'next/server'
import { getAllQueueMetrics } from '@/lib/jobs/queue-setup'

export async function GET() {
  try {
    const metrics = await getAllQueueMetrics()

    return NextResponse.json({ metrics })
  } catch (error) {
    console.error('[api/jobs/metrics] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch metrics' },
      { status: 500 }
    )
  }
}
