import { NextRequest, NextResponse } from 'next/server'
import { AnalyticsService } from '@/lib/services/analytics-service'
import { trackServerEvent } from '@/lib/analytics/segment'

const ALLOWED_EVENTS = new Set(['tribe_map_interaction', 'marketing_blog_click', 'marketing_event_rsvp'])

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { event, properties, sessionId } = body ?? {}

    if (!event || typeof event !== 'string') {
      return NextResponse.json({ success: false, error: 'Invalid event type' }, { status: 400 })
    }

    // Extract context from request
    const context = {
      userAgent: request.headers.get('user-agent') || undefined,
      ip: request.headers.get('x-forwarded-for') || 
         request.headers.get('x-real-ip') || undefined,
    }

    // Track in custom analytics system
    await AnalyticsService.track({
      eventType: event,
      sessionId,
      properties,
      context,
    })

    // Also track in Segment if event is allowed (for backwards compatibility)
    if (ALLOWED_EVENTS.has(event)) {
      await trackServerEvent({ event, properties })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error tracking event:', error)
    return NextResponse.json({ success: false, error: 'Failed to track event' }, { status: 500 })
  }
}

// Get recent events (admin only)
export async function GET(request: NextRequest) {
  try {
    // TODO: Add admin auth check
    
    const searchParams = request.nextUrl.searchParams
    const limit = Number(searchParams.get('limit')) || 50

    const events = await AnalyticsService.getRealtimeEvents(limit)

    return NextResponse.json({
      success: true,
      events,
    })
  } catch (error) {
    console.error('Error fetching events:', error)
    return NextResponse.json(
      { error: 'Failed to fetch events' },
      { status: 500 }
    )
  }
}
