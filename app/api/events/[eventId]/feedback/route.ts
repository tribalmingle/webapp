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
    await EventsService.submitFeedback(eventId, user.userId, {
      rating: Number(body?.rating),
      highlights: typeof body?.highlights === 'string' ? body.highlights : undefined,
      suggestions: typeof body?.suggestions === 'string' ? body.suggestions : undefined,
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof EventsServiceError) {
      return NextResponse.json({ success: false, error: error.code }, { status: error.status })
    }
    console.error('[events] feedback error', error)
    return NextResponse.json({ success: false, error: 'feedback_failed' }, { status: 500 })
  }
}
