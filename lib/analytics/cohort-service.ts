import type { Filter } from 'mongodb'

import type { CohortMetricDocument } from '@/lib/data/types'
import { getMongoDb } from '@/lib/mongodb'

const DEFAULT_COHORT_LIMIT = 8
const MAX_COHORT_LIMIT = 20
const MAX_WEEKS_PER_COHORT = 12

export type CohortExplorerOptions = {
  dimension?: string
  limit?: number
}

export type CohortExplorerMetric = {
  weekNumber: number
  retentionRate: number
  revenuePerUser: number
  notes?: string
}

export type CohortExplorerRow = {
  cohortKey: string
  cohortDate: string
  dimension: string
  metrics: CohortExplorerMetric[]
}

export type CohortExplorerSummary = {
  cohortCount: number
  dimension: string | null
  averageRetentionRate: number
  averageRevenuePerUser: number
  weekNumbers: number[]
}

export type CohortExplorerResult = {
  rows: CohortExplorerRow[]
  summary: CohortExplorerSummary
}

export async function getCohortExplorerData(options: CohortExplorerOptions = {}): Promise<CohortExplorerResult> {
  const limit = clamp(options.limit ?? DEFAULT_COHORT_LIMIT, 1, MAX_COHORT_LIMIT)
  const db = await getMongoDb()
  const collection = db.collection<CohortMetricDocument>('cohort_metrics')

  const filter: Filter<CohortMetricDocument> = {}
  const normalizedDimension = normalizeDimension(options.dimension)
  if (normalizedDimension) {
    filter.dimension = normalizedDimension
  }

  const docs = await collection
    .find(filter)
    .sort({ cohortDate: -1, weekNumber: 1 })
    .limit(limit * MAX_WEEKS_PER_COHORT)
    .toArray()

  const rowsMap = new Map<string, CohortExplorerRow>()
  const weekNumbers = new Set<number>()
  let totalRetention = 0
  let totalRevenue = 0
  let metricCount = 0

  for (const doc of docs) {
    if (!rowsMap.has(doc.cohortKey)) {
      if (rowsMap.size >= limit) {
        continue
      }

      rowsMap.set(doc.cohortKey, {
        cohortKey: doc.cohortKey,
        cohortDate: doc.cohortDate?.toISOString() ?? new Date().toISOString(),
        dimension: doc.dimension ?? 'global',
        metrics: [],
      })
    }

    const row = rowsMap.get(doc.cohortKey)
    if (!row) {
      continue
    }

    row.metrics.push({
      weekNumber: doc.weekNumber,
      retentionRate: doc.retentionRate,
      revenuePerUser: doc.revenuePerUser,
      notes: doc.notes ?? undefined,
    })

    weekNumbers.add(doc.weekNumber)
    totalRetention += doc.retentionRate ?? 0
    totalRevenue += doc.revenuePerUser ?? 0
    metricCount += 1
  }

  const rows = Array.from(rowsMap.values()).map((row) => ({
    ...row,
    metrics: row.metrics.sort((a, b) => a.weekNumber - b.weekNumber),
  }))

  return {
    rows,
    summary: {
      cohortCount: rows.length,
      dimension: normalizedDimension ?? null,
      averageRetentionRate: metricCount > 0 ? totalRetention / metricCount : 0,
      averageRevenuePerUser: metricCount > 0 ? totalRevenue / metricCount : 0,
      weekNumbers: Array.from(weekNumbers).sort((a, b) => a - b),
    },
  }
}

function normalizeDimension(dimension?: string | null) {
  if (!dimension || dimension.toLowerCase() === 'all') {
    return null
  }
  return dimension
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(value, max))
}
