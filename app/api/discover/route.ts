import { NextRequest, NextResponse } from 'next/server'

import { getCurrentUser } from '@/lib/auth'
import { DiscoveryService, type DiscoveryFilters, type DiscoveryMode } from '@/lib/services/discovery-service'

function parseFilters(params: URLSearchParams): DiscoveryFilters {
  const filters: DiscoveryFilters = {}
  if (params.get('verifiedOnly')) filters.verifiedOnly = params.get('verifiedOnly') === 'true'
  if (params.get('guardianApproved')) filters.guardianApproved = params.get('guardianApproved') === 'true'
  if (params.get('onlineNow')) filters.onlineNow = params.get('onlineNow') === 'true'
  if (params.get('faithPractice')) filters.faithPractice = params.get('faithPractice') ?? undefined
  if (params.get('travelMode')) filters.travelMode = params.get('travelMode') === 'passport' ? 'passport' : 'home'
  if (params.get('lifeGoals')) filters.lifeGoals = params.get('lifeGoals')?.split(',').filter(Boolean)
  return filters
}

export async function GET(request: NextRequest) {
  const authUser = await getCurrentUser()
  if (!authUser) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const searchParams = request.nextUrl.searchParams
  const mode = (searchParams.get('mode') as DiscoveryMode) ?? 'swipe'
  const recipeId = searchParams.get('recipeId') ?? undefined
  const filters = parseFilters(searchParams)

  try {
    const feed = await DiscoveryService.getFeed(authUser.userId, { mode, recipeId, filters })
    return NextResponse.json({ success: true, data: feed })
  } catch (error) {
    console.error('[discover] feed error', error)
    return NextResponse.json({ success: false, error: 'Unable to load discovery feed' }, { status: 500 })
  }
}
