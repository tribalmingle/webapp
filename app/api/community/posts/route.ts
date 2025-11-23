import { NextRequest, NextResponse } from 'next/server'

import { getCurrentUser } from '@/lib/auth'
import { CommunityService, CommunityServiceError } from '@/lib/services/community-service'

export async function POST(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ success: false, error: 'unauthorized' }, { status: 401 })
  }

  const body = await request.json().catch(() => ({}))

  try {
    const data = await CommunityService.createPost(user.userId, {
      clubId: String(body.clubId ?? ''),
      body: typeof body.body === 'string' ? body.body : undefined,
      richText: typeof body.richText === 'object' ? body.richText : undefined,
      poll: body.poll,
      tags: Array.isArray(body.tags) ? body.tags.map(String) : undefined,
    })
    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error) {
    if (error instanceof CommunityServiceError) {
      return NextResponse.json({ success: false, error: error.code }, { status: error.status })
    }
    console.error('[community] create post error', error)
    return NextResponse.json({ success: false, error: 'post_create_failed' }, { status: 500 })
  }
}
