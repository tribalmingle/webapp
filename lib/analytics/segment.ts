import crypto from 'node:crypto'

const SEGMENT_WRITE_KEY = process.env.SEGMENT_WRITE_KEY

type TrackPayload = {
  userId?: string
  anonymousId?: string
  event: string
  properties?: Record<string, unknown>
}

export async function trackServerEvent(payload: TrackPayload) {
  if (!SEGMENT_WRITE_KEY) {
    if (process.env.NODE_ENV !== 'production') {
      console.debug('[segment disabled]', payload)
    }
    return
  }

  const body = JSON.stringify({
    ...payload,
    anonymousId: payload.anonymousId || createAnonymousId(payload),
  })

  await fetch('https://api.segment.io/v1/track', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${SEGMENT_WRITE_KEY}:`).toString('base64')}`,
      'Content-Type': 'application/json',
    },
    body,
  })
}

function createAnonymousId(payload: TrackPayload): string {
  return crypto.createHash('sha256').update(payload.event + JSON.stringify(payload.properties ?? {})).digest('hex')
}