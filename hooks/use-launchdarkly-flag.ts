import { useEffect, useState } from 'react'
import * as LDClient from 'launchdarkly-js-client-sdk'

type LDValue = string | number | boolean | object | null

let clientPromise: Promise<LDClient.LDClient | null> | null = null

async function getClient() {
  if (clientPromise) return clientPromise
  const clientId = process.env.NEXT_PUBLIC_LAUNCHDARKLY_CLIENT_ID
  if (!clientId) {
    clientPromise = Promise.resolve(null)
    return clientPromise
  }
  clientPromise = new Promise<LDClient.LDClient | null>((resolve) => {
    const client = LDClient.initialize(clientId, { key: 'member-web', anonymous: true })
    client.on('ready', () => resolve(client))
    client.on('failed', () => resolve(null))
  })
  return clientPromise
}

export function useLaunchDarklyFlag<T extends LDValue>(flagKey: string, defaultValue: T): T {
  const [value, setValue] = useState<T>(defaultValue)

  useEffect(() => {
    let unsub: (() => void) | undefined
    let mounted = true

    getClient().then((client) => {
      if (!client || !mounted) return
      const initial = client.variation(flagKey, defaultValue)
      setValue(initial as T)
      unsub = client.on(`change:${flagKey}`, (settings: { current: LDValue }) => {
        setValue((settings.current as T) ?? defaultValue)
      }) as unknown as () => void
    })

    return () => {
      mounted = false
      if (typeof unsub === 'function') {
        unsub()
      }
    }
  }, [flagKey, defaultValue])

  return value
}
