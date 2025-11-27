/**
 * POST /api/chat/voice-note
 * Upload and send voice note
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

    // Parse form data (multipart for file upload)
    const formData = await request.formData()
    const receiverId = formData.get('receiverId') as string
    const audioFile = formData.get('audio') as File
    const duration = parseInt(formData.get('duration') as string)
    const locale = formData.get('locale') as string | undefined

    if (!receiverId || !audioFile || !duration) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Convert File to Buffer
    const arrayBuffer = await audioFile.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Send voice note
    const result = await ChatService.sendVoiceNote({
      userId: authUser.userId,
      receiverId,
      audioBlob: buffer,
      duration,
      locale,
    })

    // Send notification to receiver
    await NotificationService.sendVoiceNoteNotification({
      userId: receiverId,
      senderName: authUser.name || 'Someone',
      duration,
      messageId: result.messageId,
    })

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
      s3Key: result.s3Key,
    })
  } catch (error) {
    console.error('[voice-note] error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Upload failed' },
      { status: 500 }
    )
  }
}
