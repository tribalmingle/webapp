import { NextResponse } from 'next/server'

import { getCurrentUser } from '@/lib/auth'
import { InteractionService } from '@/lib/services/interaction-service'

export async function GET() {
  try {
    const authUser = await getCurrentUser()
    if (!authUser) {
      return NextResponse.json({ success: false, message: 'Authentication required' }, { status: 401 })
    }

    const matches = await InteractionService.getMatches(authUser.userId)
    return NextResponse.json({ success: true, count: matches.length, matches: matches.slice(0, 10) })
  } catch (error) {
    console.error('[matches.today] error', error)
    return NextResponse.json({ success: false, error: 'Unable to fetch matches' }, { status: 500 })
  }
}
