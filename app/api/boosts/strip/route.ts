import { NextResponse } from 'next/server'

import { getCurrentUser } from '@/lib/auth'
import { InteractionService } from '@/lib/services/interaction-service'

export async function GET() {
  const authUser = await getCurrentUser()
  if (!authUser) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const data = await InteractionService.getBoostStrip(authUser.userId)
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('[boosts.strip] failed', error)
    return NextResponse.json({ success: false, error: 'Unable to load boosts' }, { status: 500 })
  }
}
