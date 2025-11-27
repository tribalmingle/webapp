import { NextRequest, NextResponse } from 'next/server'
import { FeatureFlagService } from '@/lib/services/feature-flag-service'

export async function GET() {
  try {
    const flags = await FeatureFlagService.listFlags()
    return NextResponse.json(flags)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const flagId = await FeatureFlagService.createFlag(body)
    return NextResponse.json({ flagId })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
