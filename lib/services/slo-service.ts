/**
 * Service Level Objective (SLO) Monitoring Service
 * Track and report on platform reliability and performance SLOs
 */

import { getMongoDb } from '@/lib/mongodb'
import { COLLECTIONS } from '@/lib/db/collections'
import { getRedis } from '@/lib/redis/client'

/**
 * SLO definitions
 */
export interface SLODefinition {
  id: string
  name: string
  description: string
  target: number // Target percentage (e.g., 99.9 for 99.9%)
  measurement: 'availability' | 'latency' | 'error_rate' | 'throughput'
  window: 'hourly' | 'daily' | 'weekly' | 'monthly'
  threshold?: number // For latency measurements (ms)
  alertThreshold: number // Alert when SLO drops below this
}

/**
 * SLO measurement data point
 */
export interface SLOMeasurement {
  sloId: string
  timestamp: Date
  value: number
  total: number
  success: number
  percentage: number
  window: string
  metadata?: Record<string, any>
}

/**
 * SLO status
 */
export interface SLOStatus {
  slo: SLODefinition
  current: number
  target: number
  errorBudget: number
  errorBudgetRemaining: number
  status: 'healthy' | 'warning' | 'critical'
  measurements: SLOMeasurement[]
  lastUpdated: Date
}

/**
 * Platform SLO definitions
 */
export const PLATFORM_SLOS: SLODefinition[] = [
  {
    id: 'availability_99_9',
    name: 'Platform Availability',
    description: 'API endpoints are available and responding',
    target: 99.9,
    measurement: 'availability',
    window: 'daily',
    alertThreshold: 99.5,
  },
  {
    id: 'api_latency_p95',
    name: 'API Response Time (p95)',
    description: '95th percentile API response time under 500ms',
    target: 95.0,
    measurement: 'latency',
    window: 'hourly',
    threshold: 500, // 500ms
    alertThreshold: 90.0,
  },
  {
    id: 'api_latency_p99',
    name: 'API Response Time (p99)',
    description: '99th percentile API response time under 1000ms',
    target: 95.0,
    measurement: 'latency',
    window: 'hourly',
    threshold: 1000, // 1000ms
    alertThreshold: 90.0,
  },
  {
    id: 'error_rate',
    name: 'Error Rate',
    description: 'Less than 1% of requests result in errors',
    target: 99.0, // 99% success = 1% error
    measurement: 'error_rate',
    window: 'hourly',
    alertThreshold: 98.0,
  },
  {
    id: 'db_query_latency',
    name: 'Database Query Performance',
    description: '95th percentile database queries under 100ms',
    target: 95.0,
    measurement: 'latency',
    window: 'hourly',
    threshold: 100, // 100ms
    alertThreshold: 90.0,
  },
  {
    id: 'message_delivery',
    name: 'Message Delivery Rate',
    description: 'Messages delivered within 5 seconds',
    target: 99.5,
    measurement: 'availability',
    window: 'hourly',
    alertThreshold: 99.0,
  },
  {
    id: 'match_generation',
    name: 'Match Generation Success',
    description: 'Match generation jobs complete successfully',
    target: 99.0,
    measurement: 'availability',
    window: 'daily',
    alertThreshold: 95.0,
  },
]

/**
 * Record an SLO measurement
 */
export async function recordSLOMeasurement(
  sloId: string,
  success: number,
  total: number,
  metadata?: Record<string, any>
): Promise<void> {
  const redis = getRedis()
  const timestamp = new Date()
  const percentage = total > 0 ? (success / total) * 100 : 100
  
  const measurement: SLOMeasurement = {
    sloId,
    timestamp,
    value: success,
    total,
    success,
    percentage,
    window: getCurrentWindow('hourly'),
    metadata,
  }
  
  // Store in MongoDB for historical analysis
  const db = await getMongoDb()
  const measurements = db.collection('slo_measurements')
  await measurements.insertOne(measurement)
  
  // Update Redis cache for real-time monitoring
  if (redis) {
    const key = `slo:${sloId}:current`
    await redis.setex(key, 3600, JSON.stringify(measurement))
  }
  
  // Check if SLO is breached
  const slo = PLATFORM_SLOS.find(s => s.id === sloId)
  if (slo && percentage < slo.alertThreshold) {
    await triggerSLOAlert(slo, percentage)
  }
}

/**
 * Record availability measurement
 */
export async function recordAvailability(
  sloId: string,
  isAvailable: boolean
): Promise<void> {
  await recordSLOMeasurement(sloId, isAvailable ? 1 : 0, 1)
}

/**
 * Record latency measurement
 */
export async function recordLatency(
  sloId: string,
  latencyMs: number
): Promise<void> {
  const slo = PLATFORM_SLOS.find(s => s.id === sloId)
  if (!slo || !slo.threshold) return
  
  const meetsThreshold = latencyMs <= slo.threshold
  await recordSLOMeasurement(
    sloId,
    meetsThreshold ? 1 : 0,
    1,
    { latency_ms: latencyMs }
  )
}

/**
 * Get current SLO status
 */
export async function getSLOStatus(sloId: string): Promise<SLOStatus | null> {
  const slo = PLATFORM_SLOS.find(s => s.id === sloId)
  if (!slo) return null
  
  const db = await getMongoDb()
  const measurements = db.collection('slo_measurements')
  
  // Get measurements for the current window
  const windowStart = getWindowStart(slo.window)
  const recentMeasurements = (await measurements
    .find({
      sloId,
      timestamp: { $gte: windowStart },
    })
    .sort({ timestamp: -1 })
    .limit(1000)
    .toArray()) as unknown as SLOMeasurement[]
  
  if (recentMeasurements.length === 0) {
    return {
      slo,
      current: 100,
      target: slo.target,
      errorBudget: 100 - slo.target,
      errorBudgetRemaining: 100 - slo.target,
      status: 'healthy',
      measurements: [],
      lastUpdated: new Date(),
    }
  }
  
  // Calculate current SLO
  const totalSuccess = recentMeasurements.reduce((sum, m) => sum + m.success, 0)
  const totalRequests = recentMeasurements.reduce((sum, m) => sum + m.total, 0)
  const current = totalRequests > 0 ? (totalSuccess / totalRequests) * 100 : 100
  
  // Calculate error budget
  const errorBudget = 100 - slo.target
  const errorBudgetUsed = 100 - current
  const errorBudgetRemaining = errorBudget - errorBudgetUsed
  
  // Determine status
  let status: SLOStatus['status'] = 'healthy'
  if (current < slo.target) {
    status = 'critical'
  } else if (current < slo.alertThreshold) {
    status = 'warning'
  }
  
  return {
    slo,
    current,
    target: slo.target,
    errorBudget,
    errorBudgetRemaining,
    status,
    measurements: recentMeasurements.slice(0, 100),
    lastUpdated: new Date(),
  }
}

/**
 * Get all SLO statuses
 */
export async function getAllSLOStatuses(): Promise<SLOStatus[]> {
  const statuses = await Promise.all(
    PLATFORM_SLOS.map(slo => getSLOStatus(slo.id))
  )
  return statuses.filter((s): s is SLOStatus => s !== null)
}

/**
 * Generate SLO report
 */
export async function generateSLOReport(
  startDate: Date,
  endDate: Date
): Promise<{
  period: { start: Date; end: Date }
  slos: Array<{
    slo: SLODefinition
    achieved: number
    target: number
    breaches: number
    uptime: string
  }>
  summary: {
    totalSLOs: number
    metSLOs: number
    breachedSLOs: number
    overallHealth: number
  }
}> {
  const db = await getMongoDb()
  const measurements = db.collection('slo_measurements')
  
  const sloResults = await Promise.all(
    PLATFORM_SLOS.map(async slo => {
      const sloMeasurements = (await measurements
        .find({
          sloId: slo.id,
          timestamp: { $gte: startDate, $lte: endDate },
        })
        .toArray()) as unknown as SLOMeasurement[]
      
      if (sloMeasurements.length === 0) {
        return {
          slo,
          achieved: 100,
          target: slo.target,
          breaches: 0,
          uptime: '100.00%',
        }
      }
      
      const totalSuccess = sloMeasurements.reduce((sum, m) => sum + m.success, 0)
      const totalRequests = sloMeasurements.reduce((sum, m) => sum + m.total, 0)
      const achieved = totalRequests > 0 ? (totalSuccess / totalRequests) * 100 : 100
      
      const breaches = sloMeasurements.filter(m => m.percentage < slo.target).length
      
      return {
        slo,
        achieved,
        target: slo.target,
        breaches,
        uptime: achieved.toFixed(2) + '%',
      }
    })
  )
  
  const metSLOs = sloResults.filter(r => r.achieved >= r.target).length
  const overallHealth = sloResults.reduce((sum, r) => sum + r.achieved, 0) / sloResults.length
  
  return {
    period: { start: startDate, end: endDate },
    slos: sloResults,
    summary: {
      totalSLOs: PLATFORM_SLOS.length,
      metSLOs,
      breachedSLOs: PLATFORM_SLOS.length - metSLOs,
      overallHealth,
    },
  }
}

/**
 * Trigger SLO alert
 */
async function triggerSLOAlert(slo: SLODefinition, currentValue: number): Promise<void> {
  console.error('[SLO ALERT]', {
    slo: slo.name,
    target: slo.target,
    current: currentValue,
    threshold: slo.alertThreshold,
  })
  
  // TODO: Integrate with alerting system (PagerDuty, Slack, etc.)
  // await sendAlert({
  //   severity: 'high',
  //   title: `SLO Breach: ${slo.name}`,
  //   message: `${slo.name} is at ${currentValue.toFixed(2)}%, below threshold of ${slo.alertThreshold}%`,
  // })
}

/**
 * Helper: Get current window identifier
 */
function getCurrentWindow(windowType: SLODefinition['window']): string {
  const now = new Date()
  
  switch (windowType) {
    case 'hourly':
      return `${now.getUTCFullYear()}-${now.getUTCMonth() + 1}-${now.getUTCDate()}-${now.getUTCHours()}`
    case 'daily':
      return `${now.getUTCFullYear()}-${now.getUTCMonth() + 1}-${now.getUTCDate()}`
    case 'weekly':
      const weekNum = Math.ceil(now.getUTCDate() / 7)
      return `${now.getUTCFullYear()}-${now.getUTCMonth() + 1}-W${weekNum}`
    case 'monthly':
      return `${now.getUTCFullYear()}-${now.getUTCMonth() + 1}`
  }
}

/**
 * Helper: Get window start time
 */
function getWindowStart(windowType: SLODefinition['window']): Date {
  const now = new Date()
  
  switch (windowType) {
    case 'hourly':
      return new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), 0, 0, 0)
    case 'daily':
      return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0)
    case 'weekly':
      const dayOfWeek = now.getDay()
      const diff = now.getDate() - dayOfWeek
      return new Date(now.getFullYear(), now.getMonth(), diff, 0, 0, 0, 0)
    case 'monthly':
      return new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0)
  }
}

/**
 * Create SLO measurement indexes
 */
export async function createSLOIndexes(): Promise<void> {
  const db = await getMongoDb()
  const measurements = db.collection('slo_measurements')
  
  await Promise.all([
    measurements.createIndex({ sloId: 1, timestamp: -1 }),
    measurements.createIndex({ timestamp: -1 }),
    measurements.createIndex({ window: 1 }),
  ])
}
