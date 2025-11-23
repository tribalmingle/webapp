import { NextRequest, NextResponse } from 'next/server'

import { getCurrentUser } from '@/lib/auth'
import { EventsService } from '@/lib/services/events-service'

export async function GET(_request: NextRequest, context: { params: { eventId: string } }) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const event = await EventsService.getEventDetail(context.params.eventId, user.userId)
  if (!event) {
    return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
  }
  return NextResponse.json({ success: true, data: event })
}
