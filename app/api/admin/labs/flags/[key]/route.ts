import { NextRequest, NextResponse } from 'next/server'
import { FeatureFlagService } from '@/lib/services/feature-flag-service'

type RouteParams = {
  params: Promise<{ key: string }>
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { key } = await params
    const body = await request.json()

    if (body.action === 'toggle') {
      await FeatureFlagService.toggleFlag(key)
    } else {
      await FeatureFlagService.updateFlag(key, body)
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
