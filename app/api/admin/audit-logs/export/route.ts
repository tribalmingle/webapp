/**
 * Audit Log Export API
 * Allows admins to download audit trails in JSON or CSV formats
 */

import { NextRequest, NextResponse } from 'next/server'
import { requirePermissions } from '@/lib/middleware/rbac'
import { queryAuditLogs } from '@/lib/services/audit-service'
import {
  parseAuditQueryParams,
  serializeAuditLogs,
  DEFAULT_EXPORT_LIMIT,
  MAX_EXPORT_LIMIT,
  AuditLogQueryParams,
  SerializedAuditLog,
} from '../utils'

const EXPORT_FILENAME = 'audit-logs'

type ExportFormat = 'json' | 'csv'

function toCsv(logs: SerializedAuditLog[]): string {
  const headers = [
    'timestamp',
    'eventType',
    'severity',
    'actorId',
    'actorEmail',
    'targetId',
    'targetType',
    'action',
    'metadata',
    'ip',
    'userAgent',
  ]
  const rows = logs.map(log => [
    log.timestamp ?? '',
    log.eventType,
    log.severity,
    log.actorId ?? '',
    log.actorEmail ?? '',
    log.targetId ?? '',
    log.targetType ?? '',
    log.action,
    log.metadata ? JSON.stringify(log.metadata) : '',
    log.ip ?? '',
    log.userAgent ?? '',
  ])
  return [headers, ...rows]
    .map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
    .join('\n')
}

export async function GET(request: NextRequest) {
  const authCheck = await requirePermissions(request, {
    operation: 'EXPORT_AUDIT',
  })
  if (authCheck.error) return authCheck.error

  const url = new URL(request.url)
  const params = Object.fromEntries(url.searchParams.entries()) as AuditLogQueryParams & {
    format?: ExportFormat
  }
  const format: ExportFormat = params.format === 'csv' ? 'csv' : 'json'

  const { filters, limit } = parseAuditQueryParams(params, {
    defaultLimit: DEFAULT_EXPORT_LIMIT,
    maxLimit: MAX_EXPORT_LIMIT,
    allowPagination: false,
  })

  filters.limit = limit
  filters.skip = 0

  try {
    const logs = await queryAuditLogs(filters)
    const serialized = serializeAuditLogs(logs)

    if (format === 'csv') {
      const csv = toCsv(serialized)
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${EXPORT_FILENAME}.csv"`,
        },
      })
    }

    return NextResponse.json(
      {
        logs: serialized,
        generatedAt: new Date().toISOString(),
        total: serialized.length,
      },
      {
        headers: {
          'Content-Disposition': `attachment; filename="${EXPORT_FILENAME}.json"`,
        },
      }
    )
  } catch (error) {
    console.error('Failed to export audit logs:', error)
    return NextResponse.json(
      { error: 'Failed to export audit logs' },
      { status: 500 }
    )
  }
}
