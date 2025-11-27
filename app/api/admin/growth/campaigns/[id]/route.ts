import { NextRequest, NextResponse } from 'next/server'
import { CampaignService } from '@/lib/services/growth-service'

type RouteParams = {
  params: Promise<{ id: string }>
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const body = await request.json()

    if (body.action === 'schedule') {
      await CampaignService.scheduleCampaign(id)
    } else if (body.action === 'toggle') {
      await CampaignService.toggleCampaign(id)
    } else {
      await CampaignService.updateCampaign(id, body)
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
