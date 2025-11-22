"use client"

import type { ReactNode } from "react"
import { createContext, useContext, useEffect, useState } from "react"

type BranchClient = {
  init: (key: string, options?: Record<string, unknown>, callback?: (error: Error | null, data?: unknown) => void) => void
  track?: (event: string, metadata?: Record<string, unknown>, callback?: (error?: Error | null) => void) => void
}

interface BranchContextValue {
  branch: BranchClient | null
  ready: boolean
}

const BranchContext = createContext<BranchContextValue>({ branch: null, ready: false })

declare global {
  interface Window {
    branch?: BranchClient
  }
}

export function BranchProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<BranchContextValue>({ branch: null, ready: false })

  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_BRANCH_KEY
    if (!key) {
      return
    }
    let cancelled = false
    let script: HTMLScriptElement | null = null

    const handleReady = () => {
      if (cancelled || !window.branch) {
        return
      }
      window.branch.init(key, {}, (error) => {
        if (error) {
          console.warn("[branch] init failed", error)
          return
        }
        if (!cancelled) {
          setState({ branch: window.branch ?? null, ready: true })
        }
      })
    }

    if (window.branch) {
      handleReady()
    } else {
      script = document.createElement("script")
      script.src = "https://cdn.branch.io/branch-latest.min.js"
      script.async = true
      script.onload = handleReady
      script.onerror = () => console.warn("[branch] failed to load script")
      document.head.appendChild(script)
    }

    return () => {
      cancelled = true
      if (script && script.parentNode) {
        script.parentNode.removeChild(script)
      }
    }
  }, [])

  return <BranchContext.Provider value={state}>{children}</BranchContext.Provider>
}

export function useBranch() {
  return useContext(BranchContext)
}
