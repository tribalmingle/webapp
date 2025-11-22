import { NextRequest, NextResponse } from 'next/server'

import { getCurrentUser } from '@/lib/auth'
import { InteractionService } from '@/lib/services/interaction-service'

export async function GET(request: NextRequest) {
  const authUser = await getCurrentUser()
  if (!authUser) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const matches = await InteractionService.getMatches(authUser.userId)
    return NextResponse.json({ success: true, data: matches })
  } catch (error) {
    console.error('[matches] fetch failed', error)
    return NextResponse.json({ success: false, error: 'Unable to load matches' }, { status: 500 })
  }
}
