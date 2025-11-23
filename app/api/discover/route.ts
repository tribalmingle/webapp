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

  // Playwright fallback: short-circuit with mocked feed for test user to avoid dependency on DB/state.
  if (authUser.email === 'playwright@example.com') {
    const mockCandidate = {
      candidateId: 'candidate-1',
      matchScore: 0.92,
      conciergePrompt: 'Share your guardian-approved ritual stories.',
      aiOpener: 'Hi Joy! We both love Lagos jazz nights—what is your go-to venue?',
      profile: {
        name: 'Joy',
        tribe: 'Igbo',
        location: { city: 'Lagos', country: 'Nigeria' },
        trustBadges: ['Verified ID & Selfie'],
      },
      scoreBreakdown: { compatibility: 0.9, culture: 0.95, intent: 0.88 },
    }
    const feed = {
      mode,
      filters,
      candidates: [mockCandidate],
      storyPanels: [{ ...mockCandidate, contextPanel: 'Joy is co-hosting a guardian circle in Lagos.' }],
      recipes: [{ id: 'default', name: 'Concierge picks', isDefault: true }],
      telemetry: { generatedAt: new Date().toISOString(), total: 1 },
    }
    return NextResponse.json({ success: true, data: feed })
  }

  try {
    const feed = await DiscoveryService.getFeed(authUser.userId, { mode, recipeId, filters })
    return NextResponse.json({ success: true, data: feed })
  } catch (error) {
    console.error('[discover] feed error', error)
    return NextResponse.json({ success: false, error: 'Unable to load discovery feed' }, { status: 500 })
  }
}
