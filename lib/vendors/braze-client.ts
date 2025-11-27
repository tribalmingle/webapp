/**
 * Braze Marketing Automation Integration
 * User profile sync, campaigns, and journeys
 */

const BRAZE_API_KEY = process.env.BRAZE_API_KEY || ''
const BRAZE_REST_ENDPOINT = process.env.BRAZE_REST_ENDPOINT || 'https://rest.iad-01.braze.com'

export interface BrazeUserProfile {
  external_id: string
  email?: string
  phone?: string
  first_name?: string
  last_name?: string
  gender?: string
  dob?: string
  country?: string
  city?: string
  language?: string
  // Custom attributes
  tribe?: string
  subscription_status?: string
  match_count?: number
  message_count?: number
  event_count?: number
  last_active?: string
  signup_date?: string
}

export interface BrazeEvent {
  external_id: string
  name: string
  time: string
  properties?: Record<string, any>
}

/**
 * Create or update user profile in Braze
 */
export async function syncUserToBraze(profile: BrazeUserProfile) {
  const response = await fetch(`${BRAZE_REST_ENDPOINT}/users/track`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${BRAZE_API_KEY}`,
    },
    body: JSON.stringify({
      attributes: [profile],
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    console.error('[braze] Failed to sync user', { profile, error })
    throw new Error(`Braze sync failed: ${error}`)
  }

  const data = await response.json()
  console.log('[braze] User synced', { external_id: profile.external_id })

  return data
}

/**
 * Sync multiple user profiles in batch
 */
export async function syncUsersBatchToBraze(profiles: BrazeUserProfile[]) {
  // Braze supports up to 75 users per request
  const batchSize = 75
  const results = []

  for (let i = 0; i < profiles.length; i += batchSize) {
    const batch = profiles.slice(i, i + batchSize)

    const response = await fetch(`${BRAZE_REST_ENDPOINT}/users/track`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${BRAZE_API_KEY}`,
      },
      body: JSON.stringify({
        attributes: batch,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('[braze] Batch sync failed', { batchSize: batch.length, error })
      throw new Error(`Braze batch sync failed: ${error}`)
    }

    const data = await response.json()
    results.push(data)

    // Small delay to avoid rate limits
    if (i + batchSize < profiles.length) {
      await new Promise((resolve) => setTimeout(resolve, 100))
    }
  }

  console.log('[braze] Batch sync complete', {
    totalUsers: profiles.length,
    batches: results.length,
  })

  return results
}

/**
 * Track custom event in Braze
 */
export async function trackBrazeEvent(event: BrazeEvent) {
  const response = await fetch(`${BRAZE_REST_ENDPOINT}/users/track`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${BRAZE_API_KEY}`,
    },
    body: JSON.stringify({
      events: [event],
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    console.error('[braze] Failed to track event', { event, error })
    throw new Error(`Braze event tracking failed: ${error}`)
  }

  const data = await response.json()
  console.log('[braze] Event tracked', { event_name: event.name, user: event.external_id })

  return data
}

/**
 * Track multiple events in batch
 */
export async function trackBrazeEventsBatch(events: BrazeEvent[]) {
  const batchSize = 75

  for (let i = 0; i < events.length; i += batchSize) {
    const batch = events.slice(i, i + batchSize)

    const response = await fetch(`${BRAZE_REST_ENDPOINT}/users/track`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${BRAZE_API_KEY}`,
      },
      body: JSON.stringify({
        events: batch,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('[braze] Batch event tracking failed', { batchSize: batch.length, error })
      throw new Error(`Braze batch event tracking failed: ${error}`)
    }

    if (i + batchSize < events.length) {
      await new Promise((resolve) => setTimeout(resolve, 100))
    }
  }

  console.log('[braze] Batch events tracked', { totalEvents: events.length })
}

/**
 * Trigger a Braze campaign for a user
 */
export async function triggerBrazeCampaign(
  campaignId: string,
  userId: string,
  properties?: Record<string, any>
) {
  const response = await fetch(`${BRAZE_REST_ENDPOINT}/campaigns/trigger/send`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${BRAZE_API_KEY}`,
    },
    body: JSON.stringify({
      campaign_id: campaignId,
      recipients: [
        {
          external_user_id: userId,
          trigger_properties: properties,
        },
      ],
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    console.error('[braze] Failed to trigger campaign', { campaignId, userId, error })
    throw new Error(`Braze campaign trigger failed: ${error}`)
  }

  const data = await response.json()
  console.log('[braze] Campaign triggered', { campaignId, userId })

  return data
}

/**
 * Trigger a Braze Canvas (journey) for a user
 */
export async function triggerBrazeCanvas(
  canvasId: string,
  userId: string,
  properties?: Record<string, any>
) {
  const response = await fetch(`${BRAZE_REST_ENDPOINT}/canvas/trigger/send`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${BRAZE_API_KEY}`,
    },
    body: JSON.stringify({
      canvas_id: canvasId,
      recipients: [
        {
          external_user_id: userId,
          canvas_entry_properties: properties,
        },
      ],
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    console.error('[braze] Failed to trigger canvas', { canvasId, userId, error })
    throw new Error(`Braze canvas trigger failed: ${error}`)
  }

  const data = await response.json()
  console.log('[braze] Canvas triggered', { canvasId, userId })

  return data
}

/**
 * Update user subscription group
 */
export async function updateBrazeSubscriptionGroup(
  userId: string,
  subscriptionGroupId: string,
  subscriptionState: 'subscribed' | 'unsubscribed'
) {
  const response = await fetch(`${BRAZE_REST_ENDPOINT}/subscription/status/set`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${BRAZE_API_KEY}`,
    },
    body: JSON.stringify({
      subscription_group_id: subscriptionGroupId,
      subscription_state: subscriptionState,
      external_id: [userId],
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    console.error('[braze] Failed to update subscription group', {
      userId,
      subscriptionGroupId,
      error,
    })
    throw new Error(`Braze subscription update failed: ${error}`)
  }

  const data = await response.json()
  console.log('[braze] Subscription group updated', {
    userId,
    subscriptionGroupId,
    state: subscriptionState,
  })

  return data
}

/**
 * Delete user from Braze
 */
export async function deleteUserFromBraze(userId: string) {
  const response = await fetch(`${BRAZE_REST_ENDPOINT}/users/delete`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${BRAZE_API_KEY}`,
    },
    body: JSON.stringify({
      external_ids: [userId],
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    console.error('[braze] Failed to delete user', { userId, error })
    throw new Error(`Braze user deletion failed: ${error}`)
  }

  const data = await response.json()
  console.log('[braze] User deleted from Braze', { userId })

  return data
}
