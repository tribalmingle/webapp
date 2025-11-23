import { NextRequest, NextResponse } from 'next/server'

import { getCurrentUser } from '@/lib/auth'
import { CommunityService, CommunityServiceError } from '@/lib/services/community-service'

export async function POST(request: NextRequest, context: { params: { postId: string } }) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ success: false, error: 'unauthorized' }, { status: 401 })
  }

  const body = await request.json().catch(() => ({}))

  try {
    const data = await CommunityService.addComment(user.userId, context.params.postId, {
      body: typeof body.body === 'string' ? body.body : undefined,
      richText: typeof body.richText === 'object' ? body.richText : undefined,
      parentCommentId: typeof body.parentCommentId === 'string' ? body.parentCommentId : undefined,
    })
    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error) {
    if (error instanceof CommunityServiceError) {
      return NextResponse.json({ success: false, error: error.code }, { status: error.status })
    }
    console.error('[community] comment error', error)
    return NextResponse.json({ success: false, error: 'comment_failed' }, { status: 500 })
  }
}
