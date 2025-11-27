/**
 * Audit Logging Service
 * Comprehensive audit trail for all administrative actions and sensitive operations
 */

import { getMongoDb } from '@/lib/mongodb'
import { COLLECTIONS } from '@/lib/db/collections'
import { ObjectId } from 'mongodb'

/**
 * Audit event types
 */
export type AuditEventType =
  // User actions
  | 'user.created'
  | 'user.updated'
  | 'user.deleted'
  | 'user.banned'
  | 'user.unbanned'
  | 'user.verified'
  | 'user.role_changed'
  
  // Content moderation
  | 'content.approved'
  | 'content.rejected'
  | 'content.deleted'
  | 'content.flagged'
  
  // Reports
  | 'report.created'
  | 'report.resolved'
  | 'report.dismissed'
  
  // Payments
  | 'payment.refunded'
  | 'payment.disputed'
  
  // Events
  | 'event.created'
  | 'event.updated'
  | 'event.deleted'
  | 'event.published'
  
  // Campaigns
  | 'campaign.created'
  | 'campaign.updated'
  | 'campaign.sent'
  | 'campaign.cancelled'
  
  // System
  | 'system.config_updated'
  | 'system.feature_flag_changed'
  | 'system.job_triggered'
  | 'system.maintenance_started'
  | 'system.maintenance_ended'
  
  // Roles & permissions
  | 'role.granted'
  | 'role.revoked'
  | 'permission.granted'
  | 'permission.revoked'
  
  // Authentication
  | 'auth.login'
  | 'auth.logout'
  | 'auth.failed_login'
  | 'auth.password_changed'
  | 'auth.2fa_enabled'
  | 'auth.2fa_disabled'
  
  // Data access
  | 'data.exported'
  | 'data.imported'
  | 'data.deleted'
  
  // GDPR
  | 'gdpr.export_requested'
  | 'gdpr.deletion_requested'
  | 'gdpr.deletion_cancelled'
  | 'gdpr.data_breach_detected'

/**
 * Audit severity levels
 */
export enum AuditSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical',
}

/**
 * Audit event metadata
 */
export interface AuditMetadata {
  [key: string]: any
  ip?: string
  userAgent?: string
  resourceId?: string
  resourceType?: string
  oldValue?: any
  newValue?: any
  reason?: string
}

/**
 * Audit event structure
 */
export interface AuditEvent {
  _id?: ObjectId
  eventType: AuditEventType
  severity: AuditSeverity
  actorId: string
  actorEmail?: string
  actorRole?: string
  targetId?: string
  targetType?: string
  action: string
  metadata: AuditMetadata
  timestamp: Date
  ip?: string
  userAgent?: string
}

/**
 * Audit query filters
 */
export interface AuditQuery {
  eventType?: AuditEventType | AuditEventType[]
  actorId?: string
  targetId?: string
  severity?: AuditSeverity | AuditSeverity[]
  startDate?: Date
  endDate?: Date
  limit?: number
  skip?: number
  searchQuery?: string
}

export function buildAuditFilter(query: AuditQuery): Record<string, any> {
  const filter: Record<string, any> = {}
  
  if (query.eventType) {
    filter.eventType = Array.isArray(query.eventType)
      ? { $in: query.eventType }
      : query.eventType
  }
  
  if (query.actorId) {
    filter.actorId = query.actorId
  }
  
  if (query.targetId) {
    filter.targetId = query.targetId
  }
  
  if (query.severity) {
    filter.severity = Array.isArray(query.severity)
      ? { $in: query.severity }
      : query.severity
  }
  
  if (query.startDate || query.endDate) {
    filter.timestamp = {}
    if (query.startDate) {
      filter.timestamp.$gte = query.startDate
    }
    if (query.endDate) {
      filter.timestamp.$lte = query.endDate
    }
  }
  
  if (query.searchQuery) {
    const regex = new RegExp(query.searchQuery, 'i')
    filter.$or = [
      { action: regex },
      { actorEmail: regex },
      { actorId: regex },
      { targetId: regex },
      { targetType: regex },
      { eventType: regex },
      { 'metadata.reason': regex },
      { 'metadata.description': regex },
    ]
  }
  
  return filter
}

/**
 * Log an audit event
 */
export async function logAuditEvent(event: Omit<AuditEvent, '_id' | 'timestamp'>): Promise<void> {
  try {
    const db = await getMongoDb()
    const auditLog = db.collection(COLLECTIONS.AUDIT_LOGS)
    
    const auditEvent: AuditEvent = {
      ...event,
      timestamp: new Date(),
    }
    
    await auditLog.insertOne(auditEvent)
    
    // Log critical events to console for immediate visibility
    if (event.severity === AuditSeverity.CRITICAL) {
      console.error('[AUDIT CRITICAL]', {
        eventType: event.eventType,
        actorId: event.actorId,
        action: event.action,
        metadata: event.metadata,
      })
    }
  } catch (error) {
    console.error('Failed to log audit event:', error)
    // Don't throw - audit logging should not break main functionality
  }
}

/**
 * Query audit logs
 */
export async function queryAuditLogs(query: AuditQuery): Promise<AuditEvent[]> {
  const db = await getMongoDb()
  const auditLog = db.collection(COLLECTIONS.AUDIT_LOGS)
  const filter = buildAuditFilter(query)
  
  const events = await auditLog
    .find(filter)
    .sort({ timestamp: -1 })
    .skip(query.skip || 0)
    .limit(query.limit || 100)
    .toArray()
  
  return events as AuditEvent[]
}

/**
 * Get audit trail for a specific resource
 */
export async function getResourceAuditTrail(
  resourceId: string,
  resourceType?: string,
  limit = 50
): Promise<AuditEvent[]> {
  const db = await getMongoDb()
  const auditLog = db.collection(COLLECTIONS.AUDIT_LOGS)
  
  const filter: any = {
    $or: [
      { targetId: resourceId },
      { 'metadata.resourceId': resourceId },
    ],
  }
  
  if (resourceType) {
    filter.targetType = resourceType
  }
  
  const events = await auditLog
    .find(filter)
    .sort({ timestamp: -1 })
    .limit(limit)
    .toArray()
  
  return events as AuditEvent[]
}

/**
 * Get audit summary for compliance reports
 */
export async function getAuditSummary(
  startDate: Date,
  endDate: Date
): Promise<{
  totalEvents: number
  eventsByType: Record<string, number>
  eventsBySeverity: Record<string, number>
  uniqueActors: number
  criticalEvents: number
}> {
  const db = await getMongoDb()
  const auditLog = db.collection(COLLECTIONS.AUDIT_LOGS)
  
  const filter = {
    timestamp: {
      $gte: startDate,
      $lte: endDate,
    },
  }
  
  const [totalEvents, eventsByType, eventsBySeverity, uniqueActors, criticalEvents] = await Promise.all([
    auditLog.countDocuments(filter),
    auditLog.aggregate([
      { $match: filter },
      { $group: { _id: '$eventType', count: { $sum: 1 } } },
    ]).toArray(),
    auditLog.aggregate([
      { $match: filter },
      { $group: { _id: '$severity', count: { $sum: 1 } } },
    ]).toArray(),
    auditLog.distinct('actorId', filter).then(actors => actors.length),
    auditLog.countDocuments({ ...filter, severity: AuditSeverity.CRITICAL }),
  ])
  
  return {
    totalEvents,
    eventsByType: Object.fromEntries(
      eventsByType.map(e => [e._id, e.count])
    ),
    eventsBySeverity: Object.fromEntries(
      eventsBySeverity.map(e => [e._id, e.count])
    ),
    uniqueActors,
    criticalEvents,
  }
}

/**
 * Helper functions for common audit events
 */

export async function logUserAction(
  action: 'created' | 'updated' | 'deleted' | 'banned' | 'unbanned' | 'verified' | 'role_changed',
  actorId: string,
  targetUserId: string,
  metadata: AuditMetadata = {},
  actorEmail?: string,
  actorRole?: string
): Promise<void> {
  await logAuditEvent({
    eventType: `user.${action}` as AuditEventType,
    severity: action === 'deleted' ? AuditSeverity.WARNING : AuditSeverity.INFO,
    actorId,
    actorEmail,
    actorRole,
    targetId: targetUserId,
    targetType: 'user',
    action: `User ${action}`,
    metadata,
  })
}

export async function logContentModeration(
  action: 'approved' | 'rejected' | 'deleted' | 'flagged',
  actorId: string,
  contentId: string,
  contentType: string,
  metadata: AuditMetadata = {},
  actorEmail?: string
): Promise<void> {
  await logAuditEvent({
    eventType: `content.${action}` as AuditEventType,
    severity: action === 'deleted' ? AuditSeverity.WARNING : AuditSeverity.INFO,
    actorId,
    actorEmail,
    targetId: contentId,
    targetType: contentType,
    action: `Content ${action}`,
    metadata,
  })
}

export async function logPaymentAction(
  action: 'refunded' | 'disputed',
  actorId: string,
  paymentId: string,
  amount: number,
  reason: string,
  actorEmail?: string
): Promise<void> {
  await logAuditEvent({
    eventType: `payment.${action}` as AuditEventType,
    severity: AuditSeverity.WARNING,
    actorId,
    actorEmail,
    targetId: paymentId,
    targetType: 'payment',
    action: `Payment ${action}`,
    metadata: { amount, reason },
  })
}

export async function logSystemChange(
  action: string,
  actorId: string,
  metadata: AuditMetadata = {},
  severity: AuditSeverity = AuditSeverity.WARNING,
  actorEmail?: string
): Promise<void> {
  await logAuditEvent({
    eventType: 'system.config_updated',
    severity,
    actorId,
    actorEmail,
    action,
    metadata,
  })
}
export async function logAuthEvent(
  action: 'login' | 'logout' | 'failed_login' | 'password_changed' | '2fa_enabled' | '2fa_disabled',
  userId: string,
  ip?: string,
  userAgent?: string,
  metadata: AuditMetadata = {}
): Promise<void> {
  await logAuditEvent({
    eventType: `auth.${action}` as AuditEventType,
    severity: action === 'failed_login' ? AuditSeverity.WARNING : AuditSeverity.INFO,
    actorId: userId,
    action: `Authentication: ${action}`,
    ip,
    userAgent,
    metadata,
  })
}

export async function logDataBreach(
  description: string,
  affectedUsers: number,
  metadata: AuditMetadata = {}
): Promise<void> {
  await logAuditEvent({
    eventType: 'gdpr.data_breach_detected',
    severity: AuditSeverity.CRITICAL,
    actorId: 'system',
    action: 'Data breach detected',
    metadata: {
      ...metadata,
      description,
      affectedUsers,
      detectedAt: new Date().toISOString(),
    },
  })
}
export async function logDataExport(
  userId: string,
  dataType: string,
  recordCount: number,
  ip?: string
): Promise<void> {
  await logAuditEvent({
    eventType: 'data.exported',
    severity: AuditSeverity.WARNING,
    actorId: userId,
    action: 'Data exported',
    ip,
    metadata: {
      dataType,
      recordCount,
      exportedAt: new Date().toISOString(),
    },
  })
}

/**
 * Compliance report generation
 */
export async function generateComplianceReport(
  startDate: Date,
  endDate: Date
): Promise<{
  period: { start: Date; end: Date }
  summary: Awaited<ReturnType<typeof getAuditSummary>>
  criticalEvents: AuditEvent[]
  dataBreaches: AuditEvent[]
  failedLogins: AuditEvent[]
  dataExports: AuditEvent[]
  userDeletions: AuditEvent[]
}> {
  const [summary, criticalEvents, dataBreaches, failedLogins, dataExports, userDeletions] = await Promise.all([
    getAuditSummary(startDate, endDate),
    queryAuditLogs({
      severity: AuditSeverity.CRITICAL,
      startDate,
      endDate,
      limit: 1000,
    }),
    queryAuditLogs({
      eventType: 'gdpr.data_breach_detected',
      startDate,
      endDate,
      limit: 1000,
    }),
    queryAuditLogs({
      eventType: 'auth.failed_login',
      startDate,
      endDate,
      limit: 1000,
    }),
    queryAuditLogs({
      eventType: 'data.exported',
      startDate,
      endDate,
      limit: 1000,
    }),
    queryAuditLogs({
      eventType: ['user.deleted', 'gdpr.deletion_requested'],
      startDate,
      endDate,
      limit: 1000,
    }),
  ])
  
  return {
    period: { start: startDate, end: endDate },
    summary,
    criticalEvents,
    dataBreaches,
    failedLogins,
    dataExports,
    userDeletions,
  }
}

/**
 * Create indexes for audit log collection
 */
export async function createAuditIndexes(): Promise<void> {
  const db = await getMongoDb()
  const auditLog = db.collection(COLLECTIONS.AUDIT_LOGS)
  
  await Promise.all([
    auditLog.createIndex({ timestamp: -1 }),
    auditLog.createIndex({ eventType: 1, timestamp: -1 }),
    auditLog.createIndex({ actorId: 1, timestamp: -1 }),
    auditLog.createIndex({ targetId: 1, timestamp: -1 }),
    auditLog.createIndex({ severity: 1, timestamp: -1 }),
    auditLog.createIndex({ 'metadata.resourceId': 1 }),
  ])
}
