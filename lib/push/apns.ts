import apn from 'apn'

let provider: apn.Provider | null = null

export const getApnsProvider = () => {
  if (provider) return provider

  const keyPath = process.env.APNS_KEY_PATH
  const keyId = process.env.APNS_KEY_ID
  const teamId = process.env.APNS_TEAM_ID

  if (!keyPath || !keyId || !teamId) {
    throw new Error('Missing APNS_KEY_PATH/APNS_KEY_ID/APNS_TEAM_ID')
  }

  provider = new apn.Provider({
    token: {
      key: keyPath,
      keyId,
      teamId,
    },
    production: process.env.APNS_PRODUCTION !== 'false',
  })

  return provider
}
