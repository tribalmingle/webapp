'use server'

import { ChatSafetyService, type SafetyNudge } from '@/lib/services/chat-safety-service'

export async function checkMessageSafety(content: string, userId: string): Promise<SafetyNudge | null> {
  return await ChatSafetyService.checkMessageSafety({
    content,
    userId,
    conversationId: 'temp', // Will be replaced with actual conversation ID
  })
}

export async function moderateMessageAttachments(params: {
  messageId: string
  content: string
  attachments?: Array<{ type: string; s3Key: string }>
  userId: string
}) {
  return await ChatSafetyService.moderateAttachments(params)
}
