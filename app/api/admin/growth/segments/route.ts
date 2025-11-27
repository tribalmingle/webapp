import { NextRequest, NextResponse } from 'next/server'
import { SegmentationService } from '@/lib/services/growth-service'

export async function GET() {
  try {
    const segments = await SegmentationService.listSegments()
    return NextResponse.json(segments)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const segmentId = await SegmentationService.createSegment(body)
    return NextResponse.json({ segmentId })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
