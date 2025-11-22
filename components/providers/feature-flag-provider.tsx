"use client"

import type { ReactNode } from "react"
import { createContext, useContext, useEffect, useMemo, useState } from "react"
import * as LDClient from "launchdarkly-js-client-sdk"

import { useSessionStore } from "@/lib/state/session-store"

interface FeatureFlagContextValue {
  ready: boolean
  flags: LDClient.LDFlagSet
  getFlagValue: <T>(key: string, defaultValue: T) => T
}

const FeatureFlagContext = createContext<FeatureFlagContextValue>({
  ready: true,
  flags: {},
  getFlagValue: (_key, defaultValue) => defaultValue,
})

function buildContext(user: ReturnType<typeof useSessionStore.getState>["user"]): LDClient.LDContext {
  if (!user) {
    return {
      kind: "user",
      key: "anonymous-member",
      anonymous: true,
      custom: {
        locale: "en",
        subscriptionTier: "free",
      },
    }
  }
  return {
    kind: "user",
    key: user._id ? String(user._id) : user.email,
    anonymous: false,
    name: user.name,
    email: user.email,
    custom: {
      locale: user.country ?? "en",
      subscriptionTier: user.subscriptionPlan ?? "free",
      verified: user.verified,
    },
  }
}

export function FeatureFlagProvider({ children }: { children: ReactNode }) {
  const user = useSessionStore((state) => state.user)
  const [client, setClient] = useState<LDClient.LDClient | null>(null)
  const [flags, setFlags] = useState<LDClient.LDFlagSet>({})
  const [ready, setReady] = useState(false)

  const clientId =
    process.env.NEXT_PUBLIC_LAUNCHDARKLY_CLIENT_SIDE_ID ?? process.env.NEXT_PUBLIC_LAUNCHDARKLY_CLIENT_ID

  useEffect(() => {
    if (!clientId) {
      setReady(true)
      return
    }
    const context = buildContext(user)
    const ldClient = LDClient.initialize(clientId, context)
    setClient(ldClient)
    const handleReady = () => {
      setFlags(ldClient.allFlags())
      setReady(true)
    }
    const handleChange = () => setFlags(ldClient.allFlags())
    ldClient.on("ready", handleReady)
    ldClient.on("change", handleChange)
    return () => {
      ldClient.off("ready", handleReady)
      ldClient.off("change", handleChange)
      ldClient.close()
      setClient(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId])

  useEffect(() => {
    if (!client || !clientId) {
      return
    }
    client.identify(buildContext(user)).catch((error) => {
      console.warn("[launchdarkly] identify failed", error)
    })
  }, [client, clientId, user])

  const value = useMemo<FeatureFlagContextValue>(
    () => ({
      ready,
      flags,
      getFlagValue: (key, defaultValue) => {
        if (!clientId || !client) {
          return defaultValue
        }
        return client.variation(key, defaultValue)
      },
    }),
    [client, clientId, flags, ready],
  )

  return <FeatureFlagContext.Provider value={value}>{children}</FeatureFlagContext.Provider>
}

export function useFeatureFlags() {
  return useContext(FeatureFlagContext)
}
