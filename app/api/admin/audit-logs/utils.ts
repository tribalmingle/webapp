import { AuditEvent, AuditEventType, AuditQuery, AuditSeverity } from '@/lib/services/audit-service'

export interface AuditLogQueryParams {
  page?: string
  limit?: string
  eventType?: string
  severity?: string
  actorId?: string
  startDate?: string
  endDate?: string
  searchQuery?: string
}

interface ParseOptions {
  defaultLimit?: number
  maxLimit?: number
  allowPagination?: boolean
}

export const DEFAULT_PAGE_SIZE = 50
export const MAX_PAGE_SIZE = 200
export const DEFAULT_EXPORT_LIMIT = 1000
export const MAX_EXPORT_LIMIT = 5000

export function parseAuditQueryParams(
  params: AuditLogQueryParams,
  options: ParseOptions = {}
): { filters: AuditQuery; page: number; limit: number } {
  const defaultLimit = options.defaultLimit ?? DEFAULT_PAGE_SIZE
  const maxLimit = options.maxLimit ?? MAX_PAGE_SIZE
  const allowPagination = options.allowPagination !== false
  
  const limitValue = Math.min(
    Math.max(1, parseInt(params.limit || defaultLimit.toString(), 10)),
    maxLimit
  )
  const pageValue = allowPagination
    ? Math.max(1, parseInt(params.page || '1', 10))
    : 1
  
  const filters: AuditQuery = {
    limit: limitValue,
    skip: allowPagination ? (pageValue - 1) * limitValue : 0,
  }
  
  if (params.eventType) {
    filters.eventType = params.eventType as AuditEventType
  }
  
  if (params.severity) {
    const severityKey = params.severity.toUpperCase() as keyof typeof AuditSeverity
    if (AuditSeverity[severityKey]) {
      filters.severity = AuditSeverity[severityKey]
    }
  }
  
  if (params.actorId) {
    filters.actorId = params.actorId
  }
  
  if (params.startDate || params.endDate) {
    filters.startDate = params.startDate ? new Date(params.startDate) : undefined
    filters.endDate = params.endDate ? new Date(params.endDate) : undefined
  }
  
  if (params.searchQuery) {
    filters.searchQuery = params.searchQuery
  }
  
  return {
    filters,
    page: pageValue,
    limit: limitValue,
  }
}

export function serializeAuditLogs(logs: AuditEvent[]) {
  return logs.map(log => ({
    ...log,
    _id: log._id?.toString(),
    severity: typeof log.severity === 'string' ? log.severity.toUpperCase() : log.severity,
    timestamp: log.timestamp instanceof Date ? log.timestamp.toISOString() : log.timestamp,
  }))
}

export type SerializedAuditLog = ReturnType<typeof serializeAuditLogs>[number]
