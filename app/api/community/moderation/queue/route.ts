import { NextResponse } from 'next/server'

import { getCurrentUser } from '@/lib/auth'
import { CommunityService } from '@/lib/services/community-service'

export async function GET() {
  const user = await getCurrentUser()
  if (!user || !user.roles?.includes('admin')) {
    return NextResponse.json({ success: false, error: 'forbidden' }, { status: 403 })
  }

  try {
    const data = await CommunityService.listModerationQueue()
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('[community] moderation queue error', error)
    return NextResponse.json({ success: false, error: 'moderation_queue_failed' }, { status: 500 })
  }
}
