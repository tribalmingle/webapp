type OneSignalPayload = {
  heading: string
  content: string
  userIds: string[]
  url?: string
  data?: Record<string, unknown>
  ttlSeconds?: number
  deliveryTag?: string
  sound?: string
}

export type OneSignalSendResult =
  | { status: 'sent'; id?: string; recipients?: number }
  | { status: 'skipped'; reason: string }

const APP_ID = process.env.ONESIGNAL_APP_ID
const API_KEY = process.env.ONESIGNAL_REST_API_KEY

export async function sendOneSignalNotification(payload: OneSignalPayload): Promise<OneSignalSendResult> {
  if (!APP_ID || !API_KEY) {
    console.warn('[notifications] OneSignal credentials missing – skipping push', { userIds: payload.userIds })
    return { status: 'skipped', reason: 'missing_credentials' }
  }

  const requestBody: Record<string, unknown> = {
    app_id: APP_ID,
    include_external_user_ids: payload.userIds,
    channel_for_external_user_ids: 'push',
    headings: { en: payload.heading },
    contents: { en: payload.content },
    data: payload.data,
    url: payload.url,
    ttl: payload.ttlSeconds,
    external_id: payload.deliveryTag,
    android_channel_id: process.env.ONESIGNAL_ANDROID_CHANNEL_ID || undefined,
    ios_sound: payload.sound,
    android_sound: payload.sound,
  }

  const sanitized = Object.fromEntries(Object.entries(requestBody).filter(([, value]) => value !== undefined && value !== null))

  const response = await fetch('https://onesignal.com/api/v1/notifications', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(sanitized),
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`OneSignal request failed (${response.status}): ${body}`)
  }

  const result = (await response.json()) as { id?: string; recipients?: number }
  return { status: 'sent', id: result.id, recipients: result.recipients }
}
