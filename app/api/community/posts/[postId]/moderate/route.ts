import { NextRequest, NextResponse } from 'next/server'

import { getCurrentUser } from '@/lib/auth'
import { CommunityService, CommunityServiceError } from '@/lib/services/community-service'

export async function POST(request: NextRequest, context: { params: Promise<{ postId: string }> }) {
  const { postId } = await context.params
  const user = await getCurrentUser()
  if (!user || !user.roles?.includes('admin')) {
    return NextResponse.json({ success: false, error: 'forbidden' }, { status: 403 })
  }

  const body = await request.json().catch(() => ({}))
  const action = body.action === 'approve' ? 'approve' : 'reject'
  const notes = typeof body.notes === 'string' ? body.notes : undefined

  try {
    await CommunityService.moderatePost(postId, user.userId, action, notes)
    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof CommunityServiceError) {
      return NextResponse.json({ success: false, error: error.code }, { status: error.status })
    }
    console.error('[community] moderate error', error)
    return NextResponse.json({ success: false, error: 'moderation_failed' }, { status: 500 })
  }
}
