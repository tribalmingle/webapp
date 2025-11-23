// Phase 7: SubscriptionService skeleton
// Handles subscription lifecycle operations (stubbed) prior to Stripe integration.

export type SubscriptionPlan = 'free' | 'concierge' | 'guardian' | 'premium_plus'

export interface SubscriptionRecord {
  id: string
  userId: string
  plan: SubscriptionPlan
  trialEndsAt?: Date
  renewsAt?: Date
  status: 'active' | 'canceled' | 'past_due' | 'trialing'
  stripeCustomerId?: string
  stripeSubscriptionId?: string
  proratedFromPlan?: SubscriptionPlan
  prorationCreditCents?: number
  pastDueSince?: Date
  createdAt: Date
  updatedAt: Date
}

// In-memory stub store (replace with Mongo collection `subscriptions` + Stripe linkage)
const subscriptions = new Map<string, SubscriptionRecord>()

async function persist(record: SubscriptionRecord) {
  try {
    if (!process.env.MONGODB_URI) return
    const [{ ObjectId }, { getMongoDb }] = await Promise.all([
      import('mongodb'),
      import('@/lib/mongodb'),
    ])
    const db = await getMongoDb()
    await db.collection('subscriptions').updateOne(
      { userId: new ObjectId(record.userId) },
      {
        $set: {
          plan: record.plan,
          trialEndsAt: record.trialEndsAt,
          renewsAt: record.renewsAt,
          status: record.status,
          updatedAt: record.updatedAt,
          stripeCustomerId: record.stripeCustomerId,
          stripeSubscriptionId: record.stripeSubscriptionId,
        },
        $setOnInsert: { createdAt: record.createdAt, id: record.id },
      },
      { upsert: true },
    )
  } catch {}
}

async function fetch(userId: string): Promise<SubscriptionRecord | null> {
  try {
    if (!process.env.MONGODB_URI) return subscriptions.get(userId) || null
    const [{ ObjectId }, { getMongoDb }] = await Promise.all([
      import('mongodb'),
      import('@/lib/mongodb'),
    ])
    const db = await getMongoDb()
    const row = await db.collection('subscriptions').findOne({ userId: new ObjectId(userId) })
    if (!row) return subscriptions.get(userId) || null
    return {
      id: row.id || crypto.randomUUID(),
      userId,
      plan: row.plan,
      trialEndsAt: row.trialEndsAt || undefined,
      renewsAt: row.renewsAt || undefined,
      status: row.status,
      stripeCustomerId: row.stripeCustomerId,
      stripeSubscriptionId: row.stripeSubscriptionId,
      createdAt: row.createdAt || new Date(),
      updatedAt: row.updatedAt || new Date(),
    }
  } catch {
    return subscriptions.get(userId) || null
  }
}

function now() { return new Date() }

export async function getSubscription(userId: string): Promise<SubscriptionRecord | null> {
  return fetch(userId)
}

export async function startTrial(userId: string, plan: SubscriptionPlan = 'concierge', trialDays = 7): Promise<SubscriptionRecord> {
  const existing = subscriptions.get(userId)
  if (existing && existing.status === 'active') return existing
  const trialEndsAt = new Date(Date.now() + trialDays * 86400000)
  const rec: SubscriptionRecord = {
    id: crypto.randomUUID(),
    userId,
    plan,
    trialEndsAt,
    renewsAt: trialEndsAt,
    status: 'trialing',
    createdAt: now(),
    updatedAt: now(),
  }
  // Create Stripe customer early if key + email available (email fetch deferred to auth layer later)
  try {
    const key = process.env.STRIPE_SECRET_KEY
    if (key) {
      const [{ default: Stripe }] = await Promise.all([import('stripe')])
      const stripe = new Stripe(key, { apiVersion: '2024-06-20' })
      // We do not have email here; leave placeholder or fetch from users collection later.
      const customer = await stripe.customers.create({ metadata: { userId } })
      rec.stripeCustomerId = customer.id
    }
  } catch {}
  subscriptions.set(userId, rec)
  await persist(rec)
  return rec
}

export async function activateSubscription(userId: string, plan: SubscriptionPlan): Promise<SubscriptionRecord> {
  const existing = subscriptions.get(userId)
  // Simple proration: if upgrading mid-cycle, credit remaining days of current plan (placeholder pricing)
  let prorationCreditCents: number | undefined
  let proratedFromPlan: SubscriptionPlan | undefined
  if (existing && existing.status === 'active' && existing.plan !== plan && existing.renewsAt) {
    const remainingMs = existing.renewsAt.getTime() - Date.now()
    if (remainingMs > 0) {
      const remainingDays = remainingMs / 86400000
      const priceMap: Record<SubscriptionPlan, number> = { free: 0, concierge: 1000, guardian: 2000, premium_plus: 3000 } // cents placeholder
      const dailyOld = priceMap[existing.plan] / 30
      prorationCreditCents = Math.round(dailyOld * remainingDays)
      proratedFromPlan = existing.plan
    }
  }
  const rec: SubscriptionRecord = existing ? {
    ...existing,
    plan,
    status: 'active',
    trialEndsAt: undefined,
    renewsAt: new Date(Date.now() + 30 * 86400000), // placeholder monthly renewal
    updatedAt: now(),
    prorationCreditCents,
    proratedFromPlan
  } : {
    id: crypto.randomUUID(),
    userId,
    plan,
    status: 'active',
    renewsAt: new Date(Date.now() + 30 * 86400000),
    createdAt: now(),
    updatedAt: now(),
    prorationCreditCents: undefined,
    proratedFromPlan: undefined
  }
  // Stripe subscription creation if configured
  try {
    const key = process.env.STRIPE_SECRET_KEY
    const priceMap: Record<SubscriptionPlan, string | undefined> = {
      free: undefined,
      concierge: process.env.STRIPE_PRICE_CONCIERGE,
      guardian: process.env.STRIPE_PRICE_GUARDIAN,
      premium_plus: process.env.STRIPE_PRICE_PREMIUM_PLUS,
    }
    const priceId = priceMap[plan]
    if (key && priceId) {
      const [{ default: Stripe }] = await Promise.all([import('stripe')])
      const stripe = new Stripe(key, { apiVersion: '2024-06-20' })
      // Ensure customer
      let customerId = rec.stripeCustomerId
      if (!customerId) {
        const customer = await stripe.customers.create({ metadata: { userId } })
        customerId = customer.id
        rec.stripeCustomerId = customerId
      }
      const sub = await stripe.subscriptions.create({ customer: customerId, items: [{ price: priceId }], metadata: { userId, plan } })
      rec.stripeSubscriptionId = sub.id
      // Map renewal date if available
      if (sub.current_period_end) rec.renewsAt = new Date(sub.current_period_end * 1000)
    }
  } catch {}
  subscriptions.set(userId, rec)
  await persist(rec)
  return rec
}

export async function cancelSubscription(userId: string): Promise<SubscriptionRecord | null> {
  const existing = subscriptions.get(userId)
  if (!existing) return null
  const rec: SubscriptionRecord = { ...existing, status: 'canceled', updatedAt: now(), renewsAt: undefined }
  // Attempt Stripe cancel (immediate) if subscription exists
  try {
    const key = process.env.STRIPE_SECRET_KEY
    if (key && rec.stripeSubscriptionId) {
      const [{ default: Stripe }] = await Promise.all([import('stripe')])
      const stripe = new Stripe(key, { apiVersion: '2024-06-20' })
      await stripe.subscriptions.update(rec.stripeSubscriptionId, { cancel_at_period_end: false })
      await stripe.subscriptions.cancel(rec.stripeSubscriptionId)
    }
  } catch {}
  subscriptions.set(userId, rec)
  await persist(rec)
  return rec
}

export async function downgradeToFree(userId: string): Promise<SubscriptionRecord> {
  const existing = subscriptions.get(userId)
  const rec: SubscriptionRecord = existing ? {
    ...existing,
    plan: 'free',
    status: 'active',
    trialEndsAt: undefined,
    renewsAt: undefined,
    updatedAt: now()
  } : {
    id: crypto.randomUUID(),
    userId,
    plan: 'free',
    status: 'active',
    createdAt: now(),
    updatedAt: now()
  }
  // Optional immediate Stripe subscription cancellation if moving to free from paid
  try {
    const key = process.env.STRIPE_SECRET_KEY
    if (key && rec.stripeSubscriptionId) {
      const [{ default: Stripe }] = await Promise.all([import('stripe')])
      const stripe = new Stripe(key, { apiVersion: '2024-06-20' })
      await stripe.subscriptions.cancel(rec.stripeSubscriptionId)
      rec.stripeSubscriptionId = undefined
    }
  } catch {}
  subscriptions.set(userId, rec)
  await persist(rec)
  return rec
}

export async function markSubscriptionPastDue(userId: string): Promise<SubscriptionRecord | null> {
  const existing = subscriptions.get(userId)
  if (!existing) return null
  const rec: SubscriptionRecord = { ...existing, status: 'past_due', pastDueSince: existing.pastDueSince || now(), updatedAt: now() }
  subscriptions.set(userId, rec)
  await persist(rec)
  return rec
}

// TODO (Phase 7): Integrate Stripe customer + subscription creation, webhook-driven state sync, idempotency safeguards, telemetry spans.
// TODO (Phase 7): Add downgrade scheduling (cancel at period end) and prorated upgrade handling.
