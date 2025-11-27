#!/usr/bin/env ts-node
/**
 * Phase 8 Performance: Create recommended MongoDB indexes for admin studio.
 * Safe to re-run; uses createIndex idempotency.
 */
import { MongoClient } from 'mongodb'

const MONGO_URL = process.env.MONGODB_URI || 'mongodb://localhost:27017/tribalmingle'

async function run() {
  const client = new MongoClient(MONGO_URL)
  await client.connect()
  const db = client.db()

  const specs: Array<{ coll: string; indexes: any[] }> = [
    { coll: 'crm_notes', indexes: [ [{ userId: 1, createdAt: -1 }, {}] ] },
    { coll: 'crm_tasks', indexes: [ [{ userId: 1, status: 1, priority: -1, dueDate: 1 }, {}] ] },
    { coll: 'support_tickets', indexes: [ [{ status: 1, priority: -1, sla: 1 }, {}], [{ userId: 1, createdAt: -1 }, {}] ] },
    { coll: 'support_messages', indexes: [ [{ ticketId: 1, createdAt: 1 }, {}] ] },
    { coll: 'trust_reports', indexes: [ [{ status: 1, priority: -1, createdAt: -1 }, {}], [{ reportedUserId: 1, createdAt: -1 }, {}] ] },
    { coll: 'moderation_actions', indexes: [ [{ userId: 1, createdAt: -1 }, {}] ] },
    { coll: 'segments', indexes: [ [{ updatedAt: -1 }, {}] ] },
    { coll: 'campaigns', indexes: [ [{ status: 1, scheduledAt: 1 }, {}] ] },
    { coll: 'feature_flags', indexes: [ [{ key: 1 }, { unique: true }], [{ enabled: 1, rolloutPercentage: 1 }, {}] ] },
    { coll: 'audit_logs', indexes: [ [{ userId: 1, createdAt: -1 }, {}], [{ action: 1, createdAt: -1 }, {}] ] },
    { coll: 'photo_verification_sessions', indexes: [ [{ status: 1, createdAt: -1 }, {}], [{ userId: 1, createdAt: -1 }, {}] ] },
    { coll: 'canned_responses', indexes: [ [{ category: 1, updatedAt: -1 }, {}] ] },
    { coll: 'analytics_events', indexes: [ [{ eventType: 1, timestamp: -1 }, {}], [{ userId: 1, timestamp: -1 }, {}] ] },
    { coll: 'subscriptions', indexes: [ [{ status: 1, createdAt: -1 }, {}], [{ userId: 1, createdAt: -1 }, {}] ] },
    { coll: 'payments', indexes: [ [{ userId: 1, createdAt: -1 }, {}], [{ refundReason: 1, createdAt: -1 }, {}] ] },
  ]

  for (const spec of specs) {
    const coll = db.collection(spec.coll)
    for (const [keys, options] of spec.indexes) {
      try {
        const name = await coll.createIndex(keys, options)
        console.log(`Created/verified index ${name} on ${spec.coll}`)
      } catch (err) {
        console.error(`Failed index on ${spec.coll}`, keys, err)
      }
    }
  }

  await client.close()
  console.log('Index creation complete.')
}

run().catch(e => { console.error(e); process.exit(1) })
