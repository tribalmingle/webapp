import { NextResponse } from 'next/server'

import { getCurrentUser } from '@/lib/auth'
import { CommunityService } from '@/lib/services/community-service'

export async function GET() {
  try {
    const user = await getCurrentUser()
    const data = await CommunityService.listClubs(user?.userId)
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('[community] clubs list error', error)
    return NextResponse.json({ success: false, error: 'clubs_fetch_failed' }, { status: 500 })
  }
}
