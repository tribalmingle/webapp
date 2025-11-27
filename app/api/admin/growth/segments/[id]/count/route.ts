import { NextRequest, NextResponse } from 'next/server'
import { SegmentationService } from '@/lib/services/growth-service'
import { performance } from 'perf_hooks'

type RouteParams = {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const start = performance.now()
    const { id } = await params
    const count = await SegmentationService.getMemberCount(id)
    const ms = Math.round(performance.now() - start)
    return NextResponse.json({ count, latencyMs: ms })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
