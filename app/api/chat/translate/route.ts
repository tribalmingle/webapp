/**
 * POST /api/chat/translate
 * Translate a message
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
    const { messageId, targetLocale } = body

    if (!messageId || !targetLocale) {
      return NextResponse.json(
        { success: false, error: 'Missing messageId or targetLocale' },
        { status: 400 }
      )
    }

    const result = await ChatService.translateMessage({
      messageId,
      userId: authUser.userId,
      targetLocale,
    })

    return NextResponse.json({
      success: true,
      translatedText: result.translatedText,
      cached: result.cached,
    })
  } catch (error) {
    console.error('[translate] error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Translation failed' },
      { status: 500 }
    )
  }
}
