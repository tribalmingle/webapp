import admin from 'firebase-admin'

let app: admin.app.App | null = null

const parseServiceAccount = (raw: string) => {
  try {
    return JSON.parse(raw)
  } catch {
    const decoded = Buffer.from(raw, 'base64').toString('utf8')
    return JSON.parse(decoded)
  }
}

export const getFirebaseAdmin = () => {
  if (app) return app
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON
  if (!raw) {
    throw new Error('Missing FIREBASE_SERVICE_ACCOUNT_JSON')
  }

  const serviceAccount = parseServiceAccount(raw)
  app = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  })

  return app
}

export const getFirebaseMessaging = () => {
  const instance = getFirebaseAdmin()
  return admin.messaging(instance)
}
