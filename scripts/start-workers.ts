#!/usr/bin/env node
/**
 * Background Workers Startup Script
 * Start all BullMQ workers for background job processing
 */

import { startWorkers } from '../lib/jobs/workers'

console.log('[startup] Starting TribalMingle background workers...')
console.log('[startup] Environment:', process.env.NODE_ENV || 'development')
console.log('[startup] Redis:', process.env.REDIS_HOST || 'localhost')

try {
  startWorkers()
  console.log('[startup] All workers started successfully')
  console.log('[startup] Press Ctrl+C to stop')
} catch (error) {
  console.error('[startup] Failed to start workers:', error)
  process.exit(1)
}

// Keep process alive
process.on('SIGTERM', () => {
  console.log('[startup] SIGTERM received, shutting down gracefully...')
  process.exit(0)
})

process.on('SIGINT', () => {
  console.log('[startup] SIGINT received, shutting down gracefully...')
  process.exit(0)
})
