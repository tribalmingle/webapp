// Phase 7: Background job stubs
// Replace with actual scheduler / worker infrastructure (e.g. BullMQ / Cloud cron)

import { recordDailySnapshot } from '../services/analytics-service'
import { getMongoDb } from '../db/mongo'

export async function runDailyMetricsJob() {
  // TODO: derive real counts instead of placeholders
  await recordDailySnapshot({
    date: new Date().toISOString().slice(0,10),
    activeUsers: 42,
    giftsSent: 18,
    coinSpent: 560,
    newSubscriptions: 5,
    referralSignups: 7,
  })
}

export async function runTrialExpiryJob() {
  // TODO: scan subscriptions collection for trials ending and update status
}

export async function runWalletCleanupJob() {
  // TODO: remove orphaned pending intents > X days old
  try {
    const db = await getMongoDb()
    await db.collection('payment_intents').deleteMany({ status: 'pending', createdAt: { $lt: new Date(Date.now() - 7*24*60*60*1000) } })
  } catch {}
}

export async function runReferralFraudScanJob() {
  // TODO: heuristic checks on referral events (same IP/device, rapid signups)
}

export async function runAllScheduledJobs() {
  await runDailyMetricsJob()
  await runTrialExpiryJob()
  await runWalletCleanupJob()
  await runReferralFraudScanJob()
}
