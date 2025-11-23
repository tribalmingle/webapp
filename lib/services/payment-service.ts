// Phase 7: PaymentService scaffold
// Gateway-agnostic payment operations. Stripe/Paystack/ApplePay/GooglePay logic deferred.
// This is a non-blocking stub to enable incremental UI/API wiring.

export type PaymentGateway = 'stripe' | 'paystack' | 'apple_pay' | 'google_pay'

export interface CreateIntentParams {
  userId: string
  amountCents: number
  currency: string
  purpose: 'subscription' | 'coins' | 'gift' | 'boost'
  metadata?: Record<string, string>
}

export interface PaymentIntentResult {
  id: string
  clientSecret?: string // Stripe-style secrets; not used for Paystack
  gateway: PaymentGateway
  amountCents: number
  currency: string
  purpose: string
  createdAt: Date
  userId: string
}

// In-memory stub store (replace with persistent ledger + idempotency table)
const intents: PaymentIntentResult[] = []

function randomId() {
  return crypto.randomUUID()
}

export async function createStripeIntent(params: CreateIntentParams): Promise<PaymentIntentResult> {
  // TODO: Inject Stripe SDK; create PaymentIntent; return real client_secret.
  const intent: PaymentIntentResult = {
    id: randomId(),
    clientSecret: randomId().replace(/-/g, ''),
    gateway: 'stripe',
    amountCents: params.amountCents,
    currency: params.currency,
    purpose: params.purpose,
    createdAt: new Date(),
    userId: params.userId,
  }
  intents.push(intent)
  // Persistence (non-blocking): store stub intent if Mongo available
  try {
    if (process.env.MONGODB_URI) {
      const [{ ObjectId }, { getMongoDb }] = await Promise.all([
        import('mongodb'),
        import('@/lib/mongodb'),
      ])
      const db = await getMongoDb()
      await db.collection('payments').insertOne({
        userId: new ObjectId(params.userId),
        providerPaymentId: intent.id,
        billingProvider: 'stripe',
        amount: { currency: params.currency, valueCents: params.amountCents },
        status: 'processing',
        lineItems: [
          {
            description: params.purpose,
            quantity: 1,
            amount: { currency: params.currency, valueCents: params.amountCents },
          },
        ],
        metadata: params.metadata || {},
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    }
  } catch {}
  return intent
}

export async function recordExternalGatewayIntent(gateway: PaymentGateway, params: CreateIntentParams): Promise<PaymentIntentResult> {
  // Apple/Google Pay and Paystack will be mediated either through Stripe PaymentRequest or direct gateway tokens.
  const intent: PaymentIntentResult = {
    id: randomId(),
    gateway,
    amountCents: params.amountCents,
    currency: params.currency,
    purpose: params.purpose,
    createdAt: new Date(),
    userId: params.userId,
  }
  intents.push(intent)
  try {
    if (process.env.MONGODB_URI) {
      const [{ ObjectId }, { getMongoDb }] = await Promise.all([
        import('mongodb'),
        import('@/lib/mongodb'),
      ])
      const db = await getMongoDb()
      await db.collection('payments').insertOne({
        userId: new ObjectId(params.userId),
        providerPaymentId: intent.id,
        billingProvider: gateway === 'apple_pay' ? 'apple' : gateway === 'google_pay' ? 'google' : gateway,
        amount: { currency: params.currency, valueCents: params.amountCents },
        status: 'processing',
        lineItems: [
          {
            description: params.purpose,
            quantity: 1,
            amount: { currency: params.currency, valueCents: params.amountCents },
          },
        ],
        metadata: params.metadata || {},
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    }
  } catch {}
  return intent
}

// --- Paystack Stub ---
export interface PaystackChargeInitParams extends CreateIntentParams {
  email: string // Paystack requires customer email
}

export interface PaystackChargeResult extends PaymentIntentResult {
  authorizationUrl?: string
  reference: string
}

export async function createPaystackCharge(params: PaystackChargeInitParams): Promise<PaystackChargeResult> {
  // TODO: Call Paystack initialize transaction endpoint; return authorization_url & reference.
  const reference = 'pst_' + randomId().slice(0, 12)
  const intent: PaystackChargeResult = {
    id: reference,
    reference,
    gateway: 'paystack',
    amountCents: params.amountCents,
    currency: params.currency,
    purpose: params.purpose,
    createdAt: new Date(),
    authorizationUrl: `https://paystack.test/authorize/${reference}`,
    userId: params.userId,
  }
  intents.push(intent)
  try {
    if (process.env.MONGODB_URI) {
      const [{ ObjectId }, { getMongoDb }] = await Promise.all([
        import('mongodb'),
        import('@/lib/mongodb'),
      ])
      const db = await getMongoDb()
      await db.collection('payments').insertOne({
        userId: new ObjectId(params.userId),
        providerPaymentId: intent.id,
        billingProvider: 'paystack',
        amount: { currency: params.currency, valueCents: params.amountCents },
        status: 'processing',
        lineItems: [
          {
            description: params.purpose,
            quantity: 1,
            amount: { currency: params.currency, valueCents: params.amountCents },
          },
        ],
        metadata: params.metadata || {},
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    }
  } catch {}
  return intent
}

// --- Apple Pay & Google Pay Stubs ---
export interface ExpressWalletSession {
  id: string
  gateway: 'apple_pay' | 'google_pay'
  validUntil: Date
  amountCents: number
  currency: string
  purpose: string
}

const walletSessions: ExpressWalletSession[] = []

export async function initiateApplePaySession(params: CreateIntentParams): Promise<ExpressWalletSession> {
  // TODO: Domain association + validation using Apple Pay session API.
  const session: ExpressWalletSession = {
    id: 'ap_' + randomId().slice(0, 10),
    gateway: 'apple_pay',
    validUntil: new Date(Date.now() + 5 * 60 * 1000),
    amountCents: params.amountCents,
    currency: params.currency,
    purpose: params.purpose,
  }
  walletSessions.push(session)
  return session
}

export async function initiateGooglePaySession(params: CreateIntentParams): Promise<ExpressWalletSession> {
  // TODO: Use Google Pay JS API tokenization specs.
  const session: ExpressWalletSession = {
    id: 'gp_' + randomId().slice(0, 10),
    gateway: 'google_pay',
    validUntil: new Date(Date.now() + 5 * 60 * 1000),
    amountCents: params.amountCents,
    currency: params.currency,
    purpose: params.purpose,
  }
  walletSessions.push(session)
  return session
}

export async function listExpressWalletSessions() {
  return walletSessions.filter(s => s.validUntil.getTime() > Date.now())
}

export async function listPaymentIntents(userFilter?: string) {
  // If Mongo configured, read from payments collection instead of in-memory stub list.
  try {
    if (process.env.MONGODB_URI) {
      const [{ ObjectId }, { getMongoDb }] = await Promise.all([
        import('mongodb'),
        import('@/lib/mongodb'),
      ])
      const db = await getMongoDb()
      const query = userFilter ? { userId: new ObjectId(userFilter) } : {}
      const rows = await db.collection('payments').find(query).sort({ createdAt: -1 }).limit(200).toArray()
      return rows.map(r => ({
        id: r.providerPaymentId,
        clientSecret: r.clientSecret,
        gateway: r.billingProvider === 'apple' ? 'apple_pay' : r.billingProvider === 'google' ? 'google_pay' : r.billingProvider,
        amountCents: r.amount?.valueCents || 0,
        currency: r.amount?.currency || 'USD',
        purpose: r.lineItems?.[0]?.description || 'unknown',
        createdAt: r.createdAt || new Date(0),
        userId: r.userId?.toString() || 'unknown',
      }))
    }
  } catch {}
  return userFilter ? intents.filter(i => i.userId === userFilter) : intents
}

export interface StripeWebhookEventStub {
  id: string
  type: string
  data: Record<string, unknown>
}

export async function verifyAndParseStripeWebhook(rawBody: Buffer, signature: string | undefined): Promise<StripeWebhookEventStub | null> {
  // TODO: Use stripe.webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET)
  if (!signature) return null
  return { id: randomId(), type: 'stub.event', data: { received: true } }
}

export async function handleStripeWebhook(event: StripeWebhookEventStub) {
  // TODO: Map real event types (payment_intent.succeeded, invoice.paid, customer.subscription.updated, etc.)
  switch (event.type) {
    default:
      return { handled: false }
  }
}

// Entitlement mapping after a successful payment (simplified placeholder logic)
export async function applyEntitlementsForPayment(purpose: string, userId: string, amountCents: number, metadata?: Record<string, any>) {
  try {
    if (!process.env.MONGODB_URI) return
    const [{ ObjectId }, { getMongoDb }] = await Promise.all([
      import('mongodb'),
      import('@/lib/mongodb'),
    ])
    const db = await getMongoDb()
    if (purpose === 'subscription') {
      await db.collection('users').updateOne(
        { _id: new ObjectId(userId) },
        { $set: { subscriptionPlan: metadata?.planId || 'concierge', subscriptionUpdatedAt: new Date() } },
      )
    } else if (purpose === 'coins') {
      const coins = amountCents // 1 coin per cent (stub ratio)
      await db.collection('wallets').updateOne(
        { userId: new ObjectId(userId) },
        { $inc: { balance: coins }, $setOnInsert: { createdAt: new Date() } },
        { upsert: true },
      )
    }
  } catch {}
}

// TODO (Phase 7): Persistence, telemetry spans, idempotency keys, refund handling, ledger entries.
// TODO (Phase 7): Integrate Stripe SDK; implement Paystack initialize/verify endpoints.
// TODO (Phase 7): Apple Pay session validation + merchant ID cert handling; Google Pay tokenization.