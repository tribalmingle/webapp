#!/usr/bin/env tsx
// Creates Mongo indexes for Phase 7 hardening.
import { getMongoDb } from '@/lib/mongodb'

async function run() {
  const db = await getMongoDb()
  console.log('Creating indexes...')
  // wallet_transactions idempotency unique index (sparse to allow null)
  await db.collection('wallet_transactions').createIndex({ userId: 1, idempotencyKey: 1 }, { unique: true, sparse: true, name: 'wallet_tx_user_idem_unique' })
  // payment_intents status + entitlementApplied compound index
  await db.collection('payment_intents').createIndex({ status: 1, 'metadata.credited': 1 }, { name: 'intent_status_credit_idx' })
  // subscriptions stripeSubscriptionId lookup index
  await db.collection('subscriptions').createIndex({ stripeSubscriptionId: 1 }, { name: 'sub_stripe_id_idx' })
  // referral_events code + type index for progress aggregation
  await db.collection('referral_events').createIndex({ code: 1, type: 1 }, { name: 'referral_code_type_idx' })
  console.log('Indexes created.')
  process.exit(0)
}
run().catch(err => { console.error(err); process.exit(1) })
