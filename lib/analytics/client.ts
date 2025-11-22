export async function trackClientEvent(event: string, properties?: Record<string, unknown>) {
  const payload = JSON.stringify({ event, properties })

  try {
    if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
      const blob = new Blob([payload], { type: 'application/json' })
      navigator.sendBeacon('/api/analytics/track', blob)
      return
    }

    await fetch('/api/analytics/track', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: payload,
      keepalive: true,
    })
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.debug('[analytics] trackClientEvent failed', error)
    }
  }
}
