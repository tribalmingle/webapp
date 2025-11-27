/**
 * Admin Audit Logs API
 * Provides filtered audit log data for admin dashboard
 */

import { NextRequest, NextResponse } from 'next/server'
import { requirePermissions } from '@/lib/middleware/rbac'
import { queryAuditLogs, buildAuditFilter } from '@/lib/services/audit-service'
import { getMongoDb } from '@/lib/mongodb'
import { COLLECTIONS } from '@/lib/db/collections'
import {
  parseAuditQueryParams,
  serializeAuditLogs,
  AuditLogQueryParams,
} from './utils'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const authCheck = await requirePermissions(request, {
    operation: 'VIEW_AUDIT',
  })
  if (authCheck.error) return authCheck.error

  try {
    const url = new URL(request.url)
    const params = Object.fromEntries(url.searchParams.entries()) as AuditLogQueryParams

    const { filters, page, limit } = parseAuditQueryParams(params)
    const mongoFilter = buildAuditFilter(filters)

    const [logs, total] = await Promise.all([
      queryAuditLogs(filters),
      (async () => {
        const db = await getMongoDb()
        return db.collection(COLLECTIONS.AUDIT_LOGS).countDocuments(mongoFilter)
      })(),
    ])

    return NextResponse.json({
      logs: serializeAuditLogs(logs),
      page,
      limit,
      count: logs.length,
      total,
    })
  } catch (error) {
    console.error('Failed to fetch audit logs:', error)
    return NextResponse.json({ error: 'Failed to fetch audit logs' }, { status: 500 })
  }
}
