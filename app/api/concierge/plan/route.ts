import { NextRequest, NextResponse } from 'next/server'

import { generateConciergePlan, type ConciergeIntent, type ConciergeMemberContext } from '@/lib/services/ai-concierge-service'

const VALID_INTENTS: ConciergeIntent[] = ['introduction', 'date_plan', 'long_distance_support']

export async function POST(request: NextRequest) {
  const payload = await request.json().catch(() => null)
  if (!payload) {
    return NextResponse.json({ success: false, error: 'Invalid JSON payload' }, { status: 400 })
  }

  const intent = payload.intent as ConciergeIntent
  if (!VALID_INTENTS.includes(intent)) {
    return NextResponse.json({ success: false, error: 'Unsupported intent' }, { status: 400 })
  }

  const context: ConciergeMemberContext = {
    memberId: typeof payload.memberId === 'string' ? payload.memberId : 'anonymous',
    name: typeof payload.name === 'string' ? payload.name : undefined,
    homeCity: typeof payload.homeCity === 'string' ? payload.homeCity : undefined,
    homeCountry: typeof payload.homeCountry === 'string' ? payload.homeCountry : undefined,
    partnerCity: typeof payload.partnerCity === 'string' ? payload.partnerCity : undefined,
    partnerCountry: typeof payload.partnerCountry === 'string' ? payload.partnerCountry : undefined,
    relationshipStage: payload.relationshipStage,
    preferences: payload.preferences,
    conciergeNotes: typeof payload.conciergeNotes === 'string' ? payload.conciergeNotes : undefined,
  }

  try {
    const plan = generateConciergePlan(intent, context)
    return NextResponse.json({ success: true, plan })
  } catch (error) {
    console.error('[concierge] plan generation failed', error)
    return NextResponse.json({ success: false, error: 'Unable to generate concierge plan' }, { status: 500 })
  }
}
