/**
 * POST /api/chat/livekit-token
 * Generate LiveKit token for video call
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '../../../../lib/auth/session'
import { ChatService } from '@/lib/services/chat-service'
import { NotificationService } from '@/lib/services/notification-service'

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request)
    if (!authUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { roomName, participantId } = body

    if (!roomName || !participantId) {
      return NextResponse.json(
        { success: false, error: 'Missing roomName or participantId' },
        { status: 400 }
      )
    }

    const participantName = authUser.name || authUser.userId

    const result = await ChatService.generateLiveKitToken({
      userId: authUser.userId,
      roomName,
      participantName,
    })

    // Send invite notification to other participant
    await NotificationService.sendLiveKitInvite({
      userId: participantId,
      inviterName: participantName,
      roomName,
      roomUrl: result.roomUrl,
    })

    return NextResponse.json({
      success: true,
      token: result.token,
      roomUrl: result.roomUrl,
    })
  } catch (error) {
    console.error('[livekit-token] error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Token generation failed' },
      { status: 500 }
    )
  }
}
