import { NextRequest, NextResponse } from 'next/server'

import { getCurrentUser } from '@/lib/auth'
import { EventsService, type EventFilters } from '@/lib/services/events-service'

function buildFilters(searchParams: URLSearchParams): EventFilters {
  const filters: EventFilters = {}
  const tribe = searchParams.get('tribe')
  if (tribe) filters.tribe = tribe
  const mode = searchParams.get('mode')
  if (mode === 'virtual' || mode === 'in_person') {
    filters.mode = mode
  }
  const tags = searchParams.getAll('tag')
  if (tags.length) filters.tags = tags
  const limit = searchParams.get('limit')
  if (limit) {
    const parsed = Number(limit)
    if (!Number.isNaN(parsed)) filters.limit = parsed
  }
  return filters
}

export async function GET(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const filters = buildFilters(request.nextUrl.searchParams)
  const data = await EventsService.listUpcoming(user.userId, filters)
  return NextResponse.json({ success: true, data })
}
