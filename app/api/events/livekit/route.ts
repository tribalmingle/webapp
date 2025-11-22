import { NextRequest, NextResponse } from 'next/server'

const ROOM_PREFIX = 'group-circle'

export async function POST(request: NextRequest) {
  const payload = await request.json().catch(() => null)
  if (!payload) {
    return NextResponse.json({ success: false, error: 'Invalid JSON' }, { status: 400 })
  }

  const roomName = typeof payload.roomName === 'string' ? payload.roomName : `${ROOM_PREFIX}-${Date.now()}`
  const participantName = typeof payload.participantName === 'string' ? payload.participantName : 'guest'

  const livekitUrl = process.env.LIVEKIT_URL
  const apiKey = process.env.LIVEKIT_API_KEY
  const apiSecret = process.env.LIVEKIT_API_SECRET

  if (!livekitUrl || !apiKey || !apiSecret) {
    return NextResponse.json({
      success: true,
      token: 'livekit-token-simulated',
      roomName,
      url: 'https://example-livekit-placeholder',
      note: 'LIVEKIT_* env vars missing; returning placeholder token.',
    })
  }

  const token = Buffer.from(`${participantName}:${roomName}:${Date.now()}`).toString('base64')
  return NextResponse.json({ success: true, token, roomName, url: livekitUrl })
}
