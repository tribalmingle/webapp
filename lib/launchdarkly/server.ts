import type { LDClient, LDUser } from 'launchdarkly-node-server-sdk'
import { init } from 'launchdarkly-node-server-sdk'

let ldClientPromise: Promise<LDClient> | null = null

const sdkKey = process.env.LAUNCHDARKLY_SDK_KEY
const offline = process.env.LAUNCHDARKLY_OFFLINE === 'true' || !sdkKey

export function getLaunchDarklyClient(): Promise<LDClient> {
  if (ldClientPromise) {
    return ldClientPromise
  }

  if (offline || !sdkKey) {
    console.log('[LaunchDarkly] Running in offline mode')
    const fakeClient = {
      variation: async (_: string, __: LDUser, defaultValue: string | boolean | number) => defaultValue,
      waitForInitialization: async () => fakeClient,
      close: async () => undefined,
    } as unknown as LDClient
    ldClientPromise = Promise.resolve(fakeClient)
    return ldClientPromise
  }

  console.log('[LaunchDarkly] Initializing with SDK key')
  ldClientPromise = init(sdkKey, {
    offline,
    application: {
      id: 'tribal-mingle-web',
      version: process.env.npm_package_version,
    },
    logger: {
      // Suppress verbose info logs in development
      debug: () => {},
      info: () => {},
      warn: (message: string) => console.warn('[LaunchDarkly]', message),
      error: (message: string) => console.error('[LaunchDarkly]', message),
    },
  })
    .waitForInitialization()
    .then((client) => client)

  return ldClientPromise
}

export async function getHeroExperimentVariant(user: LDUser, defaultValue = 'default'): Promise<string> {
  const client = await getLaunchDarklyClient()
  const flagKey = 'marketing-hero-experiment'
  const value = await client.variation(flagKey, user, defaultValue)
  if (typeof value === 'string') {
    return value
  }
  return defaultValue
}