/**
 * POST /api/chat/recall
 * Recall a message within 15-minute window
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth/session'
import { ChatService } from '@/lib/services/chat-service'

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request)
    if (!authUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { messageId } = body

    if (!messageId) {
      return NextResponse.json(
        { success: false, error: 'Missing messageId' },
        { status: 400 }
      )
    }

    const result = await ChatService.recallMessage({
      messageId,
      userId: authUser.userId,
    })

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.reason },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Message recalled successfully',
    })
  } catch (error) {
    console.error('[recall] error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Recall failed' },
      { status: 500 }
    )
  }
}
