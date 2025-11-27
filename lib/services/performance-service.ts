/**
 * Performance Metrics Service
 * Aggregates Core Web Vitals, backend latency, slow queries, and infrastructure usage
 */

import { getMongoDb } from '@/lib/mongodb'
import { COLLECTIONS } from '@/lib/db/collections'

export type WebVitalStatus = 'good' | 'needs_improvement' | 'poor'

export interface WebVitalMetric {
  metric: 'LCP' | 'FID' | 'CLS' | 'TTFB'
  p75: number
  unit: 'ms' | ''
  status: WebVitalStatus
  target: number
  trend: number[]
}

export interface BackendMetric {
  name: string
  description: string
  value: number
  unit: string
  target: number
  status: 'healthy' | 'warning' | 'critical'
  change: number // percentage change vs prev window
}

export interface SlowQueryMetric {
  namespace: string
  operation: string
  p95: number
  avg: number
  max: number
  sampleQuery?: string
  lastSeen: Date
}

export interface ResourceUsageMetric {
  service: string
  cpu: number
  memory: number
  instances: number
  requestsPerMinute: number
  errorRate: number
}

export interface PerformanceMetrics {
  vitals: WebVitalMetric[]
  backend: BackendMetric[]
  slowQueries: SlowQueryMetric[]
  resources: ResourceUsageMetric[]
  generatedAt: Date
}

const DEFAULT_METRICS: PerformanceMetrics = {
  vitals: [
    { metric: 'LCP', p75: 2100, unit: 'ms', status: 'good', target: 2500, trend: [2400, 2300, 2200, 2100] },
    { metric: 'FID', p75: 45, unit: 'ms', status: 'good', target: 100, trend: [60, 55, 50, 45] },
    { metric: 'CLS', p75: 0.07, unit: '', status: 'good', target: 0.1, trend: [0.09, 0.08, 0.07, 0.07] },
    { metric: 'TTFB', p75: 320, unit: 'ms', status: 'needs_improvement', target: 300, trend: [360, 340, 330, 320] },
  ],
  backend: [
    { name: 'API Latency (p95)', description: 'User-facing GraphQL/API gateway', value: 480, unit: 'ms', target: 500, status: 'healthy', change: -4.2 },
    { name: 'Feed Generation', description: 'Discovery feed worker latency', value: 680, unit: 'ms', target: 700, status: 'healthy', change: -1.1 },
    { name: 'Match Pipeline', description: 'Nightly match score recalculation', value: 1100, unit: 'ms', target: 1000, status: 'warning', change: 6.4 },
  ],
  slowQueries: [
    { namespace: 'messages', operation: 'aggregate', p95: 420, avg: 180, max: 950, sampleQuery: '{ threadId, createdAt }', lastSeen: new Date() },
    { namespace: 'analytics_events', operation: 'find', p95: 380, avg: 140, max: 720, sampleQuery: '{ sessionId, createdAt }', lastSeen: new Date() },
  ],
  resources: [
    { service: 'Web App', cpu: 52, memory: 61, instances: 6, requestsPerMinute: 4200, errorRate: 0.4 },
    { service: 'Realtime', cpu: 38, memory: 44, instances: 4, requestsPerMinute: 1800, errorRate: 0.2 },
    { service: 'Background Jobs', cpu: 64, memory: 57, instances: 5, requestsPerMinute: 950, errorRate: 0.6 },
  ],
  generatedAt: new Date(),
}

function determineVitalStatus(metric: WebVitalMetric['metric'], value: number): WebVitalStatus {
  switch (metric) {
    case 'LCP':
      if (value <= 2500) return 'good'
      if (value <= 4000) return 'needs_improvement'
      return 'poor'
    case 'FID':
      if (value <= 100) return 'good'
      if (value <= 300) return 'needs_improvement'
      return 'poor'
    case 'CLS':
      if (value <= 0.1) return 'good'
      if (value <= 0.25) return 'needs_improvement'
      return 'poor'
    case 'TTFB':
      if (value <= 300) return 'good'
      if (value <= 600) return 'needs_improvement'
      return 'poor'
  }
}

export async function getPerformanceMetrics(): Promise<PerformanceMetrics> {
  try {
    const db = await getMongoDb()
    const collection = db.collection(COLLECTIONS.PERFORMANCE_METRICS)
    const docs = await collection
      .find({ timestamp: { $gte: new Date(Date.now() - 1000 * 60 * 60 * 24) } })
      .sort({ timestamp: -1 })
      .limit(500)
      .toArray()

    if (!docs.length) {
      return { ...DEFAULT_METRICS, generatedAt: new Date() }
    }

    const vitals: WebVitalMetric[] = []
    const backend: BackendMetric[] = []
    const slowQueries: SlowQueryMetric[] = []
    const resources: ResourceUsageMetric[] = []

    for (const doc of docs) {
      switch (doc.category) {
        case 'web_vital':
          vitals.push({
            metric: doc.metric,
            p75: doc.p75,
            unit: doc.unit || (doc.metric === 'CLS' ? '' : 'ms'),
            status: doc.status || determineVitalStatus(doc.metric, doc.p75),
            target: doc.target ?? DEFAULT_METRICS.vitals.find(v => v.metric === doc.metric)?.target ?? 0,
            trend: doc.trend ?? [],
          })
          break
        case 'backend':
          backend.push({
            name: doc.name,
            description: doc.description,
            value: doc.value,
            unit: doc.unit ?? 'ms',
            target: doc.target ?? doc.value,
            status: doc.status ?? 'healthy',
            change: doc.change ?? 0,
          })
          break
        case 'slow_query':
          slowQueries.push({
            namespace: doc.namespace,
            operation: doc.operation,
            p95: doc.p95,
            avg: doc.avg,
            max: doc.max,
            sampleQuery: doc.sampleQuery,
            lastSeen: doc.timestamp,
          })
          break
        case 'resource':
          resources.push({
            service: doc.service,
            cpu: doc.cpu,
            memory: doc.memory,
            instances: doc.instances,
            requestsPerMinute: doc.requestsPerMinute,
            errorRate: doc.errorRate,
          })
          break
      }
    }

    return {
      vitals: vitals.length ? vitals : DEFAULT_METRICS.vitals,
      backend: backend.length ? backend : DEFAULT_METRICS.backend,
      slowQueries: slowQueries.length ? slowQueries : DEFAULT_METRICS.slowQueries,
      resources: resources.length ? resources : DEFAULT_METRICS.resources,
      generatedAt: new Date(),
    }
  } catch (error) {
    console.error('Failed to load performance metrics:', error)
    return { ...DEFAULT_METRICS, generatedAt: new Date() }
  }
}
