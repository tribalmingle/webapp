// Phase 7: BoostService stub
// Handles purchasing and tracking temporary profile boosts.

export interface BoostSession {
  id: string
  userId: string
  purchasedAt: Date
  expiresAt: Date
  type: 'visibility' | 'spotlight'
  status: 'active' | 'expired'
}

const boosts = new Map<string, BoostSession[]>() // userId -> sessions

function now() { return new Date() }

export async function purchaseBoost(userId: string, type: BoostSession['type'], durationMinutes = 30): Promise<BoostSession> {
  const session: BoostSession = {
    id: crypto.randomUUID(),
    userId,
    purchasedAt: now(),
    expiresAt: new Date(Date.now() + durationMinutes * 60000),
    type,
    status: 'active',
  }
  const list = boosts.get(userId) || []
  list.push(session)
  boosts.set(userId, list)
  return session
}

export async function listActiveBoosts(userId: string): Promise<BoostSession[]> {
  const list = boosts.get(userId) || []
  const updated: BoostSession[] = list.map(b => {
    const status: BoostSession['status'] = b.expiresAt < now() ? 'expired' : 'active'
    return { ...b, status }
  })
  return updated.filter(b => b.status === 'active')
}

export async function cleanupExpired(userId: string) {
  const list = boosts.get(userId) || []
  boosts.set(userId, list.filter(b => b.expiresAt >= now()))
}

// TODO (Phase 7): Persist boosts in Mongo, add scheduled expiry job, integrate analytics & paywall gating.
