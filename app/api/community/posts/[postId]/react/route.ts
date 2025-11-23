import { NextRequest, NextResponse } from 'next/server'

import { getCurrentUser } from '@/lib/auth'
import { CommunityService, CommunityServiceError } from '@/lib/services/community-service'

export async function POST(request: NextRequest, context: { params: { postId: string } }) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ success: false, error: 'unauthorized' }, { status: 401 })
  }

  const body = await request.json().catch(() => ({}))
  const emoji = typeof body.emoji === 'string' ? body.emoji : 'heart'

  try {
    const data = await CommunityService.toggleReaction(user.userId, context.params.postId, emoji)
    return NextResponse.json({ success: true, data })
  } catch (error) {
    if (error instanceof CommunityServiceError) {
      return NextResponse.json({ success: false, error: error.code }, { status: error.status })
    }
    console.error('[community] reaction error', error)
    return NextResponse.json({ success: false, error: 'reaction_failed' }, { status: 500 })
  }
}
