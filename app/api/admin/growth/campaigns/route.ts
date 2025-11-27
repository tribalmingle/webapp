import { NextRequest, NextResponse } from 'next/server'
import { CampaignService } from '@/lib/services/growth-service'

export async function GET() {
  try {
    const campaigns = await CampaignService.listCampaigns()
    return NextResponse.json(campaigns)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const campaignId = await CampaignService.createCampaign(body)
    return NextResponse.json({ campaignId })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
