"use client"

import type { ReactNode } from "react"
import { useEffect, useMemo, useState } from "react"
import { QueryClient, QueryClientProvider, focusManager } from "@tanstack/react-query"
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client"
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister"

const DAY_IN_MS = 24 * 60 * 60 * 1000

export function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() =>
    new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 5 * 60 * 1000,
          gcTime: DAY_IN_MS,
          retry: 1,
          refetchOnWindowFocus: false,
        },
        mutations: {
          retry: 1,
        },
      },
    }),
  )

  const persister = useMemo(() => {
    if (typeof window === "undefined") {
      return null
    }
    return createSyncStoragePersister({
      storage: window.localStorage,
      key: "tm-member-query-cache",
    })
  }, [])

  useEffect(() => {
    if (typeof window === "undefined") {
      return
    }
    const onReconnect = () => focusManager.setFocused(true)
    window.addEventListener("focus", onReconnect)
    window.addEventListener("online", onReconnect)
    return () => {
      window.removeEventListener("focus", onReconnect)
      window.removeEventListener("online", onReconnect)
    }
  }, [])

  if (persister) {
    return (
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{ persister, maxAge: DAY_IN_MS }}
      >
        {children}
      </PersistQueryClientProvider>
    )
  }

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}
