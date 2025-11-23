import { NextRequest, NextResponse } from 'next/server'

import { getCurrentUser } from '@/lib/auth'
import { CommunityService, CommunityServiceError } from '@/lib/services/community-service'

export async function GET(request: NextRequest, context: { params: { slug: string } }) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ success: false, error: 'unauthorized' }, { status: 401 })
  }

  const cursor = request.nextUrl.searchParams.get('cursor') ?? undefined

  try {
    const data = await CommunityService.getClubFeed(context.params.slug, user.userId, { cursor })
    return NextResponse.json({ success: true, data })
  } catch (error) {
    if (error instanceof CommunityServiceError) {
      return NextResponse.json({ success: false, error: error.code }, { status: error.status })
    }
    console.error('[community] club feed error', error)
    return NextResponse.json({ success: false, error: 'club_fetch_failed' }, { status: 500 })
  }
}
