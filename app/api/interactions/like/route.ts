import { NextRequest, NextResponse } from 'next/server'

import { getCurrentUser } from '@/lib/auth'
import { InteractionService } from '@/lib/services/interaction-service'

export async function POST(request: NextRequest) {
  const authUser = await getCurrentUser()
  if (!authUser) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  let body: any
  try {
    body = await request.json()
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Invalid payload' }, { status: 400 })
  }

  if (!body?.targetId) {
    return NextResponse.json({ success: false, error: 'targetId required' }, { status: 400 })
  }

  try {
    const result = await InteractionService.like(authUser.userId, body.targetId, body.context)
    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    console.error('[interaction.like] failed', error)
    const message = error instanceof Error ? error.message : 'Unable to like member'
    return NextResponse.json({ success: false, error: message }, { status: message.includes('quota') ? 429 : 500 })
  }
}
