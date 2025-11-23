// Phase 7: ReferralService stub
// Generates referral codes and tracks events (stubbed) prior to persistence + fraud checks.

import crypto from 'crypto'

// Simple in-memory counters for rate limiting
const codeCreationCounters = new Map<string, { count: number; windowStart: number }>()
const EVENT_IP_WINDOW_MS = 24 * 60 * 60 * 1000
const MAX_CODES_PER_WINDOW = 3 // per user per 24h
const MAX_EVENTS_PER_IP_PER_CODE = 10 // basic anti-abuse threshold

export interface ReferralCode {
  code: string
  referrerUserId: string
  createdAt: Date
}

export interface ReferralEvent {
  id: string
  code: string
  type: 'clicked' | 'signed_up' | 'verified' | 'reward_credited'
  meta?: Record<string, unknown>
  createdAt: Date
}

const referralCodes = new Map<string, ReferralCode>() // code -> record (in-memory fallback)
const referralEvents: ReferralEvent[] = []

async function getDbSafe() {
  if (!process.env.MONGODB_URI) return null
  try {
    const [{ getMongoDb }] = await Promise.all([import('@/lib/mongodb')])
    return await getMongoDb()
  } catch { return null }
}

function generateCode(): string {
  return crypto.randomBytes(5).toString('hex') // 10-char hex code
}

export async function createReferralCode(referrerUserId: string): Promise<ReferralCode> {
  // Rate limiting: max codes per 24h per user
  const now = Date.now()
  const counter = codeCreationCounters.get(referrerUserId)
  if (!counter || now - counter.windowStart > 24 * 60 * 60 * 1000) {
    codeCreationCounters.set(referrerUserId, { count: 0, windowStart: now })
  }
  const current = codeCreationCounters.get(referrerUserId)!
  if (current.count >= MAX_CODES_PER_WINDOW) throw new Error('REFERRAL_CODE_RATE_LIMIT')
  current.count++
  const code = generateCode()
  const record: ReferralCode = { code, referrerUserId, createdAt: new Date() }
  referralCodes.set(code, record)
  try {
    const db = await getDbSafe()
    if (db) await db.collection('referral_codes').insertOne(record)
  } catch {}
  return record
}

export async function recordEvent(code: string, type: ReferralEvent['type'], meta?: Record<string, unknown>): Promise<ReferralEvent> {
  // Basic IP-based abuse check
  const ip = meta?.ip as string | undefined
  if (ip) {
    const recent = referralEvents.filter(e => e.code === code && e.meta?.ip === ip && (Date.now() - e.createdAt.getTime()) < EVENT_IP_WINDOW_MS)
    if (recent.length >= MAX_EVENTS_PER_IP_PER_CODE) throw new Error('REFERRAL_EVENT_RATE_LIMIT')
  }
  const event: ReferralEvent = { id: crypto.randomUUID(), code, type, meta, createdAt: new Date() }
  referralEvents.push(event)
  try {
    const db = await getDbSafe()
    if (db) await db.collection('referral_events').insertOne(event)
  } catch {}
  return event
}

export async function listEvents(code: string): Promise<ReferralEvent[]> {
  try {
    const db = await getDbSafe()
    if (db) {
      const rows = await db.collection('referral_events').find({ code }).sort({ createdAt: -1 }).limit(200).toArray()
      return rows.map(r => ({ id: r.id, code: r.code, type: r.type, meta: r.meta, createdAt: r.createdAt }))
    }
  } catch {}
  return referralEvents.filter(e => e.code === code)
}

export async function maybeCreditReward(code: string): Promise<boolean> {
  // Placeholder logic: if we have both signed_up and verified events, credit reward once.
  const events = referralEvents.filter(e => e.code === code)
  const hasSignedUp = events.some(e => e.type === 'signed_up')
  const hasVerified = events.some(e => e.type === 'verified')
  const alreadyCredited = events.some(e => e.type === 'reward_credited')
  if (hasSignedUp && hasVerified && !alreadyCredited) {
    await recordEvent(code, 'reward_credited')
    return true
  }
  return false
}

export async function generateOrGetExistingCode(referrerUserId: string): Promise<ReferralCode> {
  // Attempt to find existing code in DB first.
  try {
    const db = await getDbSafe()
    if (db) {
      const existing = await db.collection('referral_codes').findOne({ referrerUserId })
      if (existing) return { code: existing.code, referrerUserId: existing.referrerUserId, createdAt: existing.createdAt }
    }
  } catch {}
  // Fallback to in-memory or create new
  for (const rec of referralCodes.values()) if (rec.referrerUserId === referrerUserId) return rec
  return createReferralCode(referrerUserId)
}

export async function getReferralProgress(referrerUserId: string) {
  try {
    const db = await getDbSafe()
    if (db) {
      const codes = await db.collection('referral_codes').find({ referrerUserId }).toArray()
      const codeList = codes.map(c => c.code)
      const events = await db.collection('referral_events').find({ code: { $in: codeList } }).toArray()
      const stats = {
        clicks: events.filter(e => e.type === 'clicked').length,
        signups: events.filter(e => e.type === 'signed_up').length,
        verified: events.filter(e => e.type === 'verified').length,
        rewards: events.filter(e => e.type === 'reward_credited').length,
      }
      return { codes: codeList, stats }
    }
  } catch {}
  // Fallback aggregation from memory
  const codes = Array.from(referralCodes.values()).filter(c => c.referrerUserId === referrerUserId).map(c => c.code)
  const evs = referralEvents.filter(e => codes.includes(e.code))
  return {
    codes,
    stats: {
      clicks: evs.filter(e => e.type === 'clicked').length,
      signups: evs.filter(e => e.type === 'signed_up').length,
      verified: evs.filter(e => e.type === 'verified').length,
      rewards: evs.filter(e => e.type === 'reward_credited').length,
    },
  }
}

// Fraud heuristics placeholder: rate limits + IP duplication checks implemented.
// Future: device fingerprint correlation, geo velocity, reward abuse anomaly scores.
