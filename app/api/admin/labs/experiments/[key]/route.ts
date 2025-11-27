import { NextRequest, NextResponse } from 'next/server'
import { FeatureFlagService } from '@/lib/services/feature-flag-service'

type RouteParams = {
  params: Promise<{ key: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { key } = await params
    const results = await FeatureFlagService.getExperimentResults(key)
    return NextResponse.json(results)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
