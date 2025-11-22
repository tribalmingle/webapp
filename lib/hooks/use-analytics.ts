/**
 * Analytics Tracking Hook
 * Client-side event tracking for the custom analytics system
 */

'use client'

import { useEffect, useRef, useCallback } from 'react'
import { usePathname } from 'next/navigation'

let sessionId: string | null = null

export function useAnalytics() {
  const pathname = usePathname()
  const sessionStarted = useRef(false)

  // Initialize session on mount
  useEffect(() => {
    if (!sessionStarted.current) {
      initSession()
      sessionStarted.current = true
    }

    // End session on unmount
    return () => {
      if (sessionId) {
        endSession()
      }
    }
  }, [])

  // Track page views
  useEffect(() => {
    trackPageView(pathname)
  }, [pathname])

  const track = useCallback(async (eventType: string, properties?: Record<string, any>) => {
    try {
      await fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: eventType,
          properties,
          sessionId,
        }),
      })
    } catch (error) {
      console.error('Failed to track event:', error)
    }
  }, [])

  return { track }
}

async function initSession() {
  try {
    const response = await fetch('/api/analytics/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'start',
        entryPage: window.location.pathname,
      }),
    })

    const data = await response.json()
    if (data.success) {
      sessionId = data.sessionId
      
      // Store in sessionStorage for persistence across page reloads
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('analytics_session_id', sessionId!)
      }
    }
  } catch (error) {
    console.error('Failed to initialize session:', error)
  }
}

async function endSession() {
  if (!sessionId) return

  try {
    await fetch('/api/analytics/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'end',
        sessionId,
        exitPage: window.location.pathname,
      }),
    })
  } catch (error) {
    console.error('Failed to end session:', error)
  }
}

async function trackPageView(pathname: string) {
  try {
    await fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'page_view',
        properties: { page: pathname },
        sessionId,
      }),
    })
  } catch (error) {
    console.error('Failed to track page view:', error)
  }
}
