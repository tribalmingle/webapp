import apn from 'apn'

let provider: apn.Provider | null = null

export const getApnsProvider = () => {
  if (provider) return provider

  const keyPath = process.env.APNS_KEY_PATH
  const keyRaw = process.env.APNS_KEY
  const keyBase64 = process.env.APNS_KEY_BASE64
  const keyId = process.env.APNS_KEY_ID
  const teamId = process.env.APNS_TEAM_ID

  let key: string | undefined
  if (keyRaw) {
    key = keyRaw.includes('\n') ? keyRaw.replace(/\\n/g, '\n') : keyRaw
  } else if (keyBase64) {
    key = Buffer.from(keyBase64, 'base64').toString('utf8')
  }

  if ((!keyPath && !key) || !keyId || !teamId) {
    throw new Error('Missing APNS key config. Set APNS_KEY_PATH or APNS_KEY/APNS_KEY_BASE64 plus APNS_KEY_ID/APNS_TEAM_ID')
  }

  provider = new apn.Provider({
    token: {
      key: key ?? keyPath,
      keyId,
      teamId,
    },
    production: process.env.APNS_PRODUCTION !== 'false',
  })

  return provider
}
