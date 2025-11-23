import { NextRequest } from 'next/server'
import { sendGift } from '../../../../lib/services/gift-service'

// POST /api/gifts/send
// body: { giftId, recipientUserId, idempotencyKey?, messageId? }
export async function POST(req: NextRequest) {
  const body = await req.json()
  const senderUserId = 'demo-user' // TODO: auth integration
  if (!body.giftId || !body.recipientUserId) {
    return new Response(JSON.stringify({ error: 'MISSING_FIELDS' }), { status: 400 })
  }
  try {
    const record = await sendGift({ senderUserId, recipientUserId: body.recipientUserId, giftId: body.giftId, idempotencyKey: body.idempotencyKey, messageId: body.messageId })
    return new Response(JSON.stringify({ ok: true, record }), { status: 200 })
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message || 'FAILED' }), { status: 400 })
  }
}
