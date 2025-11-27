// Phase 7: WalletService stub
// Provides atomic coin balance operations (stubbed) pending Mongo transaction + Stripe integration.

export interface WalletTransaction {
  id: string
  type: 'credit' | 'debit'
  amount: number
  reference?: string
  idempotencyKey?: string
  createdAt: Date
}

export interface WalletSnapshot {
  balance: number
  transactions: WalletTransaction[]
}

// In-memory stub store (replace with Mongo collections: wallets, wallet_transactions)
const walletBalances = new Map<string, number>()
const walletTransactions = new Map<string, WalletTransaction[]>()

async function getDbSafe() {
  if (!process.env.MONGODB_URI) return null
  try {
    const [{ getMongoDb }] = await Promise.all([
      import('@/lib/mongodb'),
    ])
    return await getMongoDb()
  } catch {
    return null
  }
}

async function fetchBalance(userId: string): Promise<number | null> {
  const db = await getDbSafe()
  if (!db) return null
  const row = await db.collection('wallets').findOne({ userId })
  return row?.balance ?? null
}

async function persistBalance(userId: string, balance: number) {
  const db = await getDbSafe()
  if (!db) return
  await db.collection('wallets').updateOne(
    { userId },
    { $set: { balance, updatedAt: new Date() }, $setOnInsert: { createdAt: new Date(), userId } },
    { upsert: true },
  )
}

async function persistTransaction(userId: string, tx: WalletTransaction) {
  const db = await getDbSafe()
  if (!db) return
  await db.collection('wallet_transactions').insertOne({
    userId,
    id: tx.id,
    type: tx.type,
    amount: tx.amount,
    reference: tx.reference,
    idempotencyKey: tx.idempotencyKey,
    createdAt: tx.createdAt,
  })
}

async function listTransactionsMongo(userId: string): Promise<WalletTransaction[] | null> {
  const db = await getDbSafe()
  if (!db) return null
  const rows = await db.collection('wallet_transactions').find({ userId }).sort({ createdAt: -1 }).limit(200).toArray()
  return rows.map(r => ({ id: r.id, type: r.type, amount: r.amount, reference: r.reference, createdAt: r.createdAt }))
}

function ensureUser(userId: string) {
  if (!walletBalances.has(userId)) walletBalances.set(userId, 0)
  if (!walletTransactions.has(userId)) walletTransactions.set(userId, [])
}

export async function getBalance(userId: string): Promise<number> {
  const dbBal = await fetchBalance(userId)
  if (dbBal !== null) return dbBal
  ensureUser(userId)
  return walletBalances.get(userId) as number
}

export async function listTransactions(userId: string): Promise<WalletTransaction[]> {
  const mongoTx = await listTransactionsMongo(userId)
  if (mongoTx) return mongoTx
  ensureUser(userId)
  const txs = walletTransactions.get(userId) as WalletTransaction[]
  // Return in descending order by createdAt (most recent first)
  return [...txs].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
}

export async function credit(userId: string, amount: number, reference?: string, idempotencyKey?: string): Promise<number> {
  if (amount <= 0) throw new Error('Credit amount must be positive')
  const db = await getDbSafe()
  if (db) {
    if (idempotencyKey) {
      const existing = await db.collection('wallet_transactions').findOne({ userId, idempotencyKey })
      if (existing) return await getBalance(userId) // Already processed
    }
    const tx: WalletTransaction = { id: crypto.randomUUID(), type: 'credit', amount, reference, idempotencyKey, createdAt: new Date() }
    const session = db.client?.startSession?.()
    if (session) {
      try {
        let newBal = 0
        await session.withTransaction(async () => {
          const row = await db.collection('wallets').findOne({ userId }, { session })
          const current = row?.balance ?? 0
          newBal = current + amount
          await db.collection('wallets').updateOne({ userId }, { $set: { balance: newBal, updatedAt: new Date() }, $setOnInsert: { createdAt: new Date(), userId } }, { upsert: true, session })
          await db.collection('wallet_transactions').insertOne({ userId, id: tx.id, type: tx.type, amount: tx.amount, reference: tx.reference, idempotencyKey: tx.idempotencyKey, createdAt: tx.createdAt }, { session })
        })
        await session.endSession()
        return newBal
      } catch {
        await session.endSession()
      }
    }
    // Fallback non-transactional persistence
    await persistBalance(userId, (await getBalance(userId)) + amount)
    await persistTransaction(userId, tx)
    return await getBalance(userId)
  }
  ensureUser(userId)
  // Check for duplicate idempotency key in memory
  if (idempotencyKey) {
    const existing = walletTransactions.get(userId)!.find(t => t.idempotencyKey === idempotencyKey)
    if (existing) return walletBalances.get(userId) as number // Already processed
  }
  const balance = (walletBalances.get(userId) as number) + amount
  walletBalances.set(userId, balance)
  const tx: WalletTransaction = { id: crypto.randomUUID(), type: 'credit', amount, reference, idempotencyKey, createdAt: new Date() }
  walletTransactions.get(userId)!.push(tx)
  return balance
}

export async function debit(userId: string, amount: number, reference?: string, idempotencyKey?: string): Promise<number> {
  if (amount <= 0) throw new Error('Debit amount must be positive')
  const db = await getDbSafe()
  if (db) {
    if (idempotencyKey) {
      const existing = await db.collection('wallet_transactions').findOne({ userId, idempotencyKey })
      if (existing) return await getBalance(userId)
    }
    const tx: WalletTransaction = { id: crypto.randomUUID(), type: 'debit', amount, reference, idempotencyKey, createdAt: new Date() }
    const session = db.client?.startSession?.()
    if (session) {
      try {
        let newBal = 0
        await session.withTransaction(async () => {
          const row = await db.collection('wallets').findOne({ userId }, { session })
          const current = row?.balance ?? 0
          if (current < amount) throw new Error('Insufficient balance')
          newBal = current - amount
          await db.collection('wallets').updateOne({ userId }, { $set: { balance: newBal, updatedAt: new Date() }, $setOnInsert: { createdAt: new Date(), userId } }, { upsert: true, session })
          await db.collection('wallet_transactions').insertOne({ userId, id: tx.id, type: tx.type, amount: tx.amount, reference: tx.reference, idempotencyKey: tx.idempotencyKey, createdAt: tx.createdAt }, { session })
        })
        await session.endSession()
        return newBal
      } catch (e) {
        await session.endSession()
        throw e
      }
    }
    // Fallback non-transactional
    const current = (await getBalance(userId))
    if (current < amount) throw new Error('Insufficient balance')
    await persistBalance(userId, current - amount)
    await persistTransaction(userId, tx)
    return await getBalance(userId)
  }
  ensureUser(userId)
  // Check for duplicate idempotency key in memory
  if (idempotencyKey) {
    const existing = walletTransactions.get(userId)!.find(t => t.idempotencyKey === idempotencyKey)
    if (existing) return walletBalances.get(userId) as number // Already processed
  }
  const current = walletBalances.get(userId) as number
  if (current < amount) throw new Error('Insufficient balance')
  const balance = current - amount
  walletBalances.set(userId, balance)
  const tx: WalletTransaction = { id: crypto.randomUUID(), type: 'debit', amount, reference, idempotencyKey, createdAt: new Date() }
  walletTransactions.get(userId)!.push(tx)
  return balance
}

export async function getSnapshot(userId: string): Promise<WalletSnapshot> {
  return { balance: await getBalance(userId), transactions: await listTransactions(userId) }
}

// TODO (Phase 7): Telemetry spans, Stripe coin purchases, refund & adjustment operations, unique index on idempotencyKey.
