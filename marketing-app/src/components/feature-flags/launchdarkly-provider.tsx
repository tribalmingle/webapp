"use client"

import type { ReactNode } from "react"
import { createContext, useContext, useEffect, useState } from "react"
import * as LDClient from "launchdarkly-js-client-sdk"

let ldClient: LDClient.LDClient | null = null

const LaunchDarklyContext = createContext<LDClient.LDClient | null>(null)

export function LaunchDarklyProvider({ children }: { children: ReactNode }) {
  const clientId = process.env.NEXT_PUBLIC_LAUNCHDARKLY_CLIENT_ID
  const [ready, setReady] = useState(() => !clientId)
  const [client, setClient] = useState<LDClient.LDClient | null>(() => (clientId ? ldClient : null))

  useEffect(() => {
    if (!clientId) {
      return
    }

    if (!ldClient) {
      ldClient = LDClient.initialize(clientId, { key: "marketing-site", anonymous: true })
    }

    const handleReady = () => {
      setClient(ldClient)
      setReady(true)
    }

    ldClient?.on("ready", handleReady)
    ldClient?.waitForInitialization().then(handleReady).catch((error) => {
      console.error("LaunchDarkly initialization failed", error)
      setReady(true)
    })

    return () => {
      ldClient?.off("ready", handleReady)
    }
  }, [clientId])

  if (!ready) {
    return null
  }

  return <LaunchDarklyContext.Provider value={client}>{children}</LaunchDarklyContext.Provider>
}

export function useLaunchDarklyClient() {
  return useContext(LaunchDarklyContext)
}

export function useLaunchDarklyFlag<T>(flagKey: string, defaultValue: T) {
  const client = useLaunchDarklyClient()
  const [value, setValue] = useState<T>(defaultValue)

  useEffect(() => {
    let isMounted = true

    async function evaluate() {
      if (!client) {
        if (isMounted) {
          setValue(defaultValue)
        }
        return
      }

      const variation = await client.variation(flagKey, defaultValue)
      if (isMounted) {
        setValue(variation as T)
      }
    }

    evaluate()

    if (!client) {
      return () => {
        isMounted = false
      }
    }

    const handler = () => evaluate()
    client.on(`change:${flagKey}`, handler)

    return () => {
      isMounted = false
      client.off(`change:${flagKey}`, handler)
    }
  }, [client, flagKey, defaultValue])

  return value
}
