import { ObjectId } from 'mongodb'
import apn from 'apn'
import { getMongoDb } from '@/lib/mongodb'
import { getFirebaseMessaging } from './firebase'
import { getApnsProvider } from './apns'

export type PushCategory = 'like' | 'match' | 'message'

export type PushPayload = {
  title: string
  body: string
  data?: Record<string, string>
  deepLink?: string
  category: PushCategory
}

type DeviceTokenRecord = {
  _id?: ObjectId
  userId: ObjectId
  deviceToken: string
  tokenType?: 'fcm' | 'apns'
  platform?: 'ios' | 'android'
  enabled?: boolean
}

const DEFAULT_PREFS = {
  pushNotifications: true,
  emailUpdates: false,
  newMatches: true,
  messages: true,
  promotions: false,
}

const stringifyData = (data?: Record<string, string>) => {
  if (!data) return {}
  return Object.fromEntries(
    Object.entries(data).map(([key, value]) => [key, String(value)])
  )
}

const resolveTokenType = (token: DeviceTokenRecord) => {
  if (token.tokenType === 'fcm' || token.tokenType === 'apns') {
    return token.tokenType
  }
  return token.platform === 'ios' ? 'apns' : 'fcm'
}

const shouldSendForCategory = (prefs: typeof DEFAULT_PREFS, category: PushCategory) => {
  if (!prefs.pushNotifications) return false
  if (category === 'message') return prefs.messages
  if (category === 'like' || category === 'match') return prefs.newMatches
  return true
}

const getUserPrefs = async (userId: ObjectId) => {
  const db = await getMongoDb()
  const prefs = await db
    .collection('notification_preferences')
    .findOne({ userId: userId.toHexString() }, { projection: { _id: 0, userId: 0 } })

  return { ...DEFAULT_PREFS, ...(prefs ?? {}) }
}

const disableToken = async (token: DeviceTokenRecord) => {
  const db = await getMongoDb()
  await db.collection('device_tokens').updateOne(
    { _id: token._id },
    { $set: { enabled: false, updatedAt: new Date() } }
  )
}

export const sendPushToUser = async (userId: string, payload: PushPayload) => {
  const db = await getMongoDb()
  const userObjectId = ObjectId.isValid(userId) ? new ObjectId(userId) : null
  if (!userObjectId) return { sent: 0 }

  const prefs = await getUserPrefs(userObjectId)
  if (!shouldSendForCategory(prefs, payload.category)) {
    return { sent: 0, skipped: true }
  }

  const tokens = await db
    .collection<DeviceTokenRecord>('device_tokens')
    .find({ userId: userObjectId, enabled: { $ne: false } })
    .toArray()

  if (!tokens.length) return { sent: 0 }

  let sent = 0
  const data = stringifyData({ ...payload.data, deepLink: payload.deepLink || '' })

  for (const token of tokens) {
    const tokenType = resolveTokenType(token)
    try {
      if (tokenType === 'fcm') {
        await getFirebaseMessaging().send({
          token: token.deviceToken,
          notification: {
            title: payload.title,
            body: payload.body,
          },
          android: {
            priority: 'high',
            notification: {
              sound: 'default',
              channelId: 'default',
            },
          },
          apns: {
            headers: {
              'apns-priority': '10',
              'apns-push-type': 'alert',
            },
            payload: {
              aps: {
                sound: 'default',
                alert: {
                  title: payload.title,
                  body: payload.body,
                },
              },
            },
          },
          data,
        })
        sent += 1
      } else {
        const provider = getApnsProvider()
        const note = new apn.Notification()
        const bundleId = process.env.APNS_BUNDLE_ID
        if (!bundleId) {
          throw new Error('Missing APNS_BUNDLE_ID')
        }
        note.topic = bundleId
        note.alert = { title: payload.title, body: payload.body }
        note.sound = 'default'
        note.payload = data
        note.pushType = 'alert'
        note.priority = 10
        const response = await provider.send(note, token.deviceToken)
        if (response.failed?.length) {
          await disableToken(token)
        } else {
          sent += 1
        }
      }
    } catch (error: any) {
      const code = error?.code || error?.errorInfo?.code
      if (code === 'messaging/registration-token-not-registered' || code === 'messaging/invalid-argument') {
        await disableToken(token)
      }
      throw error
    }
  }

  return { sent }
}
