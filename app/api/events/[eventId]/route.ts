import { NextRequest, NextResponse } from 'next/server'

import { getCurrentUser } from '@/lib/auth'
import { EventsService } from '@/lib/services/events-service'

export async function GET(_request: NextRequest, context: any) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const eventId = context?.params?.eventId
  const event = await EventsService.getEventDetail(eventId, user.userId)
  if (!event) {
    return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
  }
  return NextResponse.json({ success: true, data: event })
}
