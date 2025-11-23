import { NextRequest, NextResponse } from 'next/server'

import { getCurrentUser } from '@/lib/auth'
import { EventsService, EventsServiceError } from '@/lib/services/events-service'

export async function POST(request: NextRequest, context: any) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json().catch(() => ({}))

  try {
    const eventId = context?.params?.eventId
    const data = await EventsService.registerForEvent(eventId, user.userId, {
      source: typeof body?.source === 'string' ? body.source : 'member_app',
    })
    return NextResponse.json({ success: true, data })
  } catch (error) {
    if (error instanceof EventsServiceError) {
      return NextResponse.json({ success: false, error: error.code }, { status: error.status })
    }
    console.error('[events] register error', error)
    return NextResponse.json({ success: false, error: 'registration_failed' }, { status: 500 })
  }
}
