import { NextRequest, NextResponse } from 'next/server'
import { enqueuePushEvent } from '@/lib/services/push-events-service'

const requireInternalSecret = (request: NextRequest) => {
  const secret = process.env.PUSH_EVENTS_SECRET
  if (!secret) return false
  const header = request.headers.get('x-internal-secret')
  return header === secret
}

export async function POST(request: NextRequest) {
  if (!requireInternalSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json().catch(() => ({}))
  const { recipientUserId, senderUserId, senderName, senderPhoto, messagePreview, threadId } = body

  if (!recipientUserId || !senderUserId || !senderName) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  await enqueuePushEvent({
    type: 'message',
    recipientUserId: String(recipientUserId),
    senderUserId: String(senderUserId),
    senderName: String(senderName),
    senderPhoto: senderPhoto ? String(senderPhoto) : undefined,
    messagePreview: messagePreview ? String(messagePreview) : undefined,
    threadId: threadId ? String(threadId) : undefined,
  })

  return NextResponse.json({ success: true })
}
