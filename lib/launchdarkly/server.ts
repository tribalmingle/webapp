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
      // Suppress verbose logs in development
      debug: () => {},
      info: () => {},
      warn: (message: string) => {
        // Suppress "unknown flag" warnings - these are expected when flags haven't been created yet
        if (!message.includes('Unknown feature flag')) {
          console.warn('[LaunchDarkly]', message)
        }
      },
      error: (message: string) => {
        // Suppress "unknown flag" errors - gracefully fall back to defaults
        if (!message.includes('Unknown feature flag')) {
          console.error('[LaunchDarkly]', message)
        }
      },
    },
  })
    .waitForInitialization()
    .then((client) => client)

  return ldClientPromise
}

export async function getHeroExperimentVariant(user: LDUser, defaultValue = 'default'): Promise<string> {
  const client = await getLaunchDarklyClient()
  const flagKey = 'marketing-hero-experiment'
  try {
    const value = await client.variation(flagKey, user, defaultValue)
    if (typeof value === 'string') {
      return value
    }
  } catch (error) {
    // Silently fall back to default if flag doesn't exist
    console.log(`[LaunchDarkly] Using default value for unknown flag "${flagKey}"`)
  }
  return defaultValue
}