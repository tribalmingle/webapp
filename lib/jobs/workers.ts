/**
 * Background Workers Initialization
 * Starts all BullMQ workers
 */

import { Worker } from 'bullmq'
import { createMatchGenerationWorker } from './match-generation'
import { createNotificationSchedulerWorker } from './notification-scheduler'
import { createEventRemindersWorker } from './event-reminders'
import { createCampaignExecutorWorker } from './campaign-executor'
import { createDataExportWorker } from './data-export'
import { createAccountDeletionWorker } from './account-deletion'
import { matchExpiryWorker } from './match-expiry'
import { notificationDigestWorker } from './notification-digest'
import { closeAllQueues } from './queue-setup'

let workers: Worker[] = []

/**
 * Start all background workers
 */
export function startWorkers() {
  console.log('[workers] Starting all background workers...')

  workers = [
    createMatchGenerationWorker(),
    createNotificationSchedulerWorker(),
    createEventRemindersWorker(),
    createCampaignExecutorWorker(),
    createDataExportWorker(),
    createAccountDeletionWorker(),
    matchExpiryWorker,
    notificationDigestWorker,
  ]

  console.log(`[workers] Started ${workers.length} workers`)

  return workers
}

/**
 * Stop all background workers
 */
export async function stopWorkers() {
  console.log('[workers] Stopping all background workers...')

  const closePromises = workers.map((worker) => worker.close())
  await Promise.all(closePromises)

  workers = []

  console.log('[workers] All workers stopped')
}

/**
 * Graceful shutdown
 */
export async function gracefulShutdown() {
  console.log('[workers] Initiating graceful shutdown...')

  // Stop accepting new jobs
  await stopWorkers()

  // Close all queue connections
  await closeAllQueues()

  console.log('[workers] Graceful shutdown complete')
}

// Handle process termination
process.on('SIGTERM', async () => {
  console.log('[workers] SIGTERM received')
  await gracefulShutdown()
  process.exit(0)
})

process.on('SIGINT', async () => {
  console.log('[workers] SIGINT received')
  await gracefulShutdown()
  process.exit(0)
})

// Auto-start workers if this file is run directly
if (require.main === module) {
  startWorkers()
  console.log('[workers] Workers running. Press Ctrl+C to stop.')
}
