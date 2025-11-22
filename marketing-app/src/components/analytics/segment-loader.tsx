"use client"

import { AnalyticsBrowser } from "@segment/analytics-next"
import { useEffect } from "react"

let analytics: ReturnType<typeof AnalyticsBrowser.load> | null = null

export function SegmentLoader() {
  useEffect(() => {
    const writeKey = process.env.NEXT_PUBLIC_SEGMENT_WRITE_KEY
    if (!writeKey || analytics) {
      return
    }
    analytics = AnalyticsBrowser.load({ writeKey })
  }, [])

  return null
}
