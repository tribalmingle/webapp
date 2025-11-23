#!/usr/bin/env tsx
// Recompute wallet balances from wallet_transactions and report mismatches.
import { getMongoDb } from '@/lib/mongodb'

async function run() {
  const db = await getMongoDb()
  const wallets = await db.collection('wallets').find().toArray()
  let mismatches = 0
  for (const w of wallets) {
    const txs = await db.collection('wallet_transactions').find({ userId: w.userId }).toArray()
    const computed = txs.reduce((acc, t) => acc + (t.type === 'credit' ? t.amount : -t.amount), 0)
    if (computed !== w.balance) {
      mismatches++
      console.log(`Mismatch user ${w.userId}: stored=${w.balance} computed=${computed}`)
    }
  }
  console.log(`Ledger reconciliation complete. Mismatches: ${mismatches}`)
  process.exit(mismatches > 0 ? 1 : 0)
}
run().catch(err => { console.error(err); process.exit(1) })
