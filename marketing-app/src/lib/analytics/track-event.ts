"use client"

interface MarketingEventPayload {
  event: string
  properties?: Record<string, any>
}

const DEFAULT_ANALYTICS_ENDPOINT = process.env.NEXT_PUBLIC_CORE_ANALYTICS_ENDPOINT ?? "http://localhost:3000/api/analytics/track"

declare global {
  interface Window {
    analytics?: {
      track: (event: string, properties?: Record<string, any>) => void
    }
  }
}

export async function trackMarketingEvent(event: string, properties?: Record<string, any>) {
  if (typeof window === "undefined") {
    return
  }

  const payload: MarketingEventPayload = {
    event,
    properties: {
      source: "marketing-site",
      ...properties,
    },
  }

  if (window.analytics?.track) {
    window.analytics.track(event, payload.properties)
    return
  }

  try {
    await fetch(DEFAULT_ANALYTICS_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event,
        properties: payload.properties,
        context: { source: "marketing-site" },
      }),
    })
  } catch (error) {
    console.warn("Marketing analytics fallback failed", error)
  }
}
