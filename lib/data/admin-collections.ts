/**
 * Admin Dashboard Extended Collections
 * New collections for experiments, support tickets, email campaigns, and GDPR exports
 */

import { z } from 'zod'
import { ObjectId } from 'mongodb'

// ============================================================================
// Schema Helpers (reused from main collections)
// ============================================================================

const objectIdSchema = z.custom<ObjectId>(
  (val) => val instanceof ObjectId || (typeof val === 'string' && ObjectId.isValid(val)),
  { message: 'Invalid ObjectId' }
)

function withTimestamps<T extends z.ZodRawShape>(schema: T) {
  return z.object({
    ...schema,
    createdAt: z.date().default(() => new Date()),
    updatedAt: z.date().default(() => new Date()),
  })
}

// ============================================================================
// Experiments Collection
// ============================================================================

const experimentTargetAudienceSchema = z.object({
  percentOfUsers: z.number().min(0).max(100),
  filters: z.object({
    planIds: z.array(z.string()).optional(),
    tribes: z.array(z.string()).optional(),
    countries: z.array(z.string()).optional(),
    registeredAfter: z.date().optional(),
    minTrustScore: z.number().min(0).max(100).optional(),
  }).default({}),
})

const experimentVariantSchema = z.object({
  variantKey: z.string().min(1),
  name: z.string().min(1),
  weight: z.number().min(0).max(100),
  config: z.record(z.string(), z.any()).default({}),
})

const experimentMetricSchema = z.object({
  eventType: z.string(),
  aggregation: z.enum(['count', 'rate', 'avg', 'sum']),
  window: z.enum(['day', 'week', 'month']),
})

const experimentGuardrailSchema = z.object({
  metricKey: z.string(),
  threshold: z.number(),
  operator: z.enum(['lt', 'gt', 'lte', 'gte']),
})

const experimentResultsSchema = z.object({
  sampleSizes: z.record(z.string(), z.number()),
  metrics: z.record(z.string(), z.object({
    control: z.number(),
    treatment: z.number(),
    lift: z.number(),
    pValue: z.number(),
    isSignificant: z.boolean(),
  })),
  winner: z.string().optional(),
  confidence: z.number().optional(),
  calculatedAt: z.date(),
})

const experimentRolloutConfigSchema = z.object({
  winnerVariant: z.string(),
  rolloutPercentage: z.number().min(0).max(100),
  rolloutStartedAt: z.date(),
})

export const experimentSchema = withTimestamps({
  _id: objectIdSchema.optional(),
  experimentKey: z.string().min(1).max(64),
  name: z.string().min(1).max(255),
  description: z.string().max(2000).default(''),
  
  createdBy: objectIdSchema,
  owner: z.string().email(),
  
  targetAudience: experimentTargetAudienceSchema,
  variants: z.array(experimentVariantSchema).min(2),
  
  primaryMetric: experimentMetricSchema,
  secondaryMetrics: z.array(experimentMetricSchema).default([]),
  guardrails: z.array(experimentGuardrailSchema).default([]),
  
  status: z.enum(['draft', 'running', 'paused', 'completed', 'rolled_back']).default('draft'),
  startedAt: z.date().optional(),
  endedAt: z.date().optional(),
  pausedAt: z.date().optional(),
  
  results: experimentResultsSchema.optional(),
  rolloutConfig: experimentRolloutConfigSchema.optional(),
  
  minSampleSize: z.number().int().positive().default(1000),
  minDurationDays: z.number().int().positive().default(7),
})

export type ExperimentDocument = z.infer<typeof experimentSchema>

export const EXPERIMENT_INDEXES = [
  { key: { experimentKey: 1 }, name: 'experiment_key_unique', unique: true },
  { key: { status: 1, startedAt: -1 }, name: 'experiment_status_started_idx' },
  { key: { 'primaryMetric.eventType': 1 }, name: 'experiment_metric_idx' },
  { key: { owner: 1, status: 1 }, name: 'experiment_owner_idx' },
]

// ============================================================================
// Experiment Assignments Collection
// ============================================================================

export const experimentAssignmentSchema = withTimestamps({
  _id: objectIdSchema.optional(),
  userId: objectIdSchema,
  experimentKey: z.string(),
  variantKey: z.string(),
  
  assignedAt: z.date(),
  assignmentSource: z.enum(['server', 'client']).default('server'),
  
  firstExposedAt: z.date().optional(),
  exposureCount: z.number().int().nonnegative().default(0),
  
  converted: z.boolean().default(false),
  convertedAt: z.date().optional(),
  conversionValue: z.number().optional(),
})

export type ExperimentAssignmentDocument = z.infer<typeof experimentAssignmentSchema>

export const EXPERIMENT_ASSIGNMENT_INDEXES = [
  { key: { userId: 1, experimentKey: 1 }, name: 'assignment_user_experiment_unique', unique: true },
  { key: { experimentKey: 1, variantKey: 1, assignedAt: -1 }, name: 'assignment_experiment_variant_idx' },
  { key: { experimentKey: 1, converted: 1 }, name: 'assignment_conversion_idx' },
]

// ============================================================================
// Support Tickets Collection
// ============================================================================

const ticketMessageSchema = z.object({
  _id: objectIdSchema.default(() => new ObjectId()),
  authorId: objectIdSchema,
  authorType: z.enum(['user', 'agent', 'system']),
  content: z.string().max(10000),
  attachments: z.array(z.object({
    url: z.string().url(),
    type: z.string(),
    name: z.string(),
  })).default([]),
  isInternal: z.boolean().default(false),
  createdAt: z.date().default(() => new Date()),
})

const ticketResolutionSchema = z.object({
  type: z.enum(['resolved', 'no_action', 'duplicate', 'spam']),
  notes: z.string().optional(),
  resolvedBy: objectIdSchema.optional(),
  resolvedAt: z.date().optional(),
})

export const supportTicketSchema = withTimestamps({
  _id: objectIdSchema.optional(),
  ticketNumber: z.string().min(1),
  
  reporterId: objectIdSchema,
  reporterEmail: z.string().email(),
  
  category: z.enum(['account', 'billing', 'technical', 'safety', 'feedback', 'other']),
  subcategory: z.string().optional(),
  subject: z.string().max(255),
  description: z.string().max(10000),
  
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  slaDeadline: z.date().optional(),
  
  assignedTo: objectIdSchema.optional(),
  assignedTeam: z.string().optional(),
  
  status: z.enum(['new', 'open', 'pending_user', 'pending_internal', 'resolved', 'closed', 'escalated']).default('new'),
  
  resolution: ticketResolutionSchema.optional(),
  
  satisfactionRating: z.number().min(1).max(5).optional(),
  satisfactionFeedback: z.string().optional(),
  
  relatedUserId: objectIdSchema.optional(),
  relatedPaymentId: objectIdSchema.optional(),
  relatedReportIds: z.array(objectIdSchema).default([]),
  
  messages: z.array(ticketMessageSchema).default([]),
  tags: z.array(z.string()).default([]),
  
  firstResponseAt: z.date().optional(),
  lastActivityAt: z.date().default(() => new Date()),
})

export type SupportTicketDocument = z.infer<typeof supportTicketSchema>

export const SUPPORT_TICKET_INDEXES = [
  { key: { ticketNumber: 1 }, name: 'ticket_number_unique', unique: true },
  { key: { reporterId: 1, createdAt: -1 }, name: 'ticket_reporter_idx' },
  { key: { status: 1, priority: -1, createdAt: 1 }, name: 'ticket_status_priority_idx' },
  { key: { assignedTo: 1, status: 1 }, name: 'ticket_assignment_idx' },
  { key: { category: 1, status: 1, createdAt: -1 }, name: 'ticket_category_status_idx' },
  { key: { slaDeadline: 1 }, name: 'ticket_sla_idx', partialFilterExpression: { status: { $in: ['new', 'open'] } } },
]

// ============================================================================
// Email Campaigns Collection
// ============================================================================

const emailAudienceSchema = z.object({
  type: z.enum(['all', 'segment', 'list', 'dynamic']),
  segmentId: z.string().optional(),
  userIds: z.array(objectIdSchema).optional(),
  dynamicQuery: z.record(z.string(), z.any()).optional(),
  estimatedSize: z.number().int().nonnegative().default(0),
})

const emailMetricsSchema = z.object({
  sent: z.number().int().nonnegative().default(0),
  delivered: z.number().int().nonnegative().default(0),
  bounced: z.number().int().nonnegative().default(0),
  opened: z.number().int().nonnegative().default(0),
  clicked: z.number().int().nonnegative().default(0),
  unsubscribed: z.number().int().nonnegative().default(0),
  complained: z.number().int().nonnegative().default(0),
  openRate: z.number().optional(),
  clickRate: z.number().optional(),
  bounceRate: z.number().optional(),
})

export const emailCampaignSchema = withTimestamps({
  _id: objectIdSchema.optional(),
  
  campaignKey: z.string().min(1).max(64),
  name: z.string().min(1).max(255),
  type: z.enum(['transactional', 'marketing', 'reengagement', 'announcement']),
  
  subject: z.string().max(255),
  previewText: z.string().max(150).optional(),
  templateId: z.string(),
  templateVariables: z.record(z.string(), z.any()).default({}),
  
  audience: emailAudienceSchema,
  
  scheduledAt: z.date().optional(),
  sentAt: z.date().optional(),
  
  status: z.enum(['draft', 'scheduled', 'sending', 'sent', 'cancelled']).default('draft'),
  
  metrics: emailMetricsSchema.default({}),
  
  createdBy: objectIdSchema,
})

export type EmailCampaignDocument = z.infer<typeof emailCampaignSchema>

export const EMAIL_CAMPAIGN_INDEXES = [
  { key: { campaignKey: 1 }, name: 'campaign_key_unique', unique: true },
  { key: { status: 1, scheduledAt: 1 }, name: 'campaign_status_schedule_idx' },
  { key: { type: 1, status: 1 }, name: 'campaign_type_status_idx' },
]

// ============================================================================
// Email Events Collection
// ============================================================================

export const emailEventSchema = withTimestamps({
  _id: objectIdSchema.optional(),
  
  userId: objectIdSchema,
  email: z.string().email(),
  campaignId: objectIdSchema.optional(),
  
  eventType: z.enum(['sent', 'delivered', 'bounced', 'opened', 'clicked', 'unsubscribed', 'complained']),
  
  bounceType: z.enum(['hard', 'soft']).optional(),
  bounceReason: z.string().optional(),
  clickedUrl: z.string().url().optional(),
  
  providerMessageId: z.string(),
  provider: z.enum(['resend', 'sendgrid', 'ses']).default('resend'),
  
  occurredAt: z.date(),
})

export type EmailEventDocument = z.infer<typeof emailEventSchema>

export const EMAIL_EVENT_INDEXES = [
  { key: { userId: 1, occurredAt: -1 }, name: 'email_event_user_idx' },
  { key: { campaignId: 1, eventType: 1, occurredAt: -1 }, name: 'email_event_campaign_idx' },
  { key: { providerMessageId: 1 }, name: 'email_event_provider_msg_idx' },
  { key: { createdAt: 1 }, name: 'email_event_ttl', expireAfterSeconds: 7776000 }, // 90 days
]

// ============================================================================
// GDPR Data Exports Collection
// ============================================================================

export const gdprDataExportSchema = withTimestamps({
  _id: objectIdSchema.optional(),
  userId: objectIdSchema,
  
  requestedAt: z.date(),
  requestedVia: z.enum(['settings', 'email', 'support']),
  
  status: z.enum(['pending', 'processing', 'ready', 'downloaded', 'expired', 'failed']).default('pending'),
  processingStartedAt: z.date().optional(),
  
  completedAt: z.date().optional(),
  downloadUrl: z.string().url().optional(),
  fileSizeBytes: z.number().int().nonnegative().optional(),
  expiresAt: z.date().optional(),
  
  downloadedAt: z.date().optional(),
  downloadIp: z.string().optional(),
  
  includedCollections: z.array(z.string()).default([]),
  recordCounts: z.record(z.string(), z.number()).default({}),
  
  error: z.object({
    code: z.string(),
    message: z.string(),
    occurredAt: z.date(),
  }).optional(),
})

export type GDPRDataExportDocument = z.infer<typeof gdprDataExportSchema>

export const GDPR_EXPORT_INDEXES = [
  { key: { userId: 1, requestedAt: -1 }, name: 'gdpr_user_idx' },
  { key: { status: 1, requestedAt: 1 }, name: 'gdpr_status_idx' },
  { key: { expiresAt: 1 }, name: 'gdpr_expiry_ttl', expireAfterSeconds: 0 },
]

// ============================================================================
// User Flags Collection
// ============================================================================

const userFlagsDataSchema = z.object({
  isVIP: z.boolean().default(false),
  vipSince: z.date().optional(),
  vipReason: z.string().optional(),
  
  isSuspectedBot: z.boolean().default(false),
  botScore: z.number().min(0).max(100).optional(),
  botDetectedAt: z.date().optional(),
  botSignals: z.array(z.string()).default([]),
  
  isRepeatOffender: z.boolean().default(false),
  offenseCount: z.number().int().nonnegative().default(0),
  offenses: z.array(z.object({
    type: z.string(),
    date: z.date(),
    action: z.string(),
  })).default([]),
  
  isWatchlist: z.boolean().default(false),
  watchlistReason: z.string().optional(),
  watchlistAddedAt: z.date().optional(),
  watchlistAddedBy: objectIdSchema.optional(),
  
  trustScore: z.number().min(0).max(100).default(50),
  trustLastCalculatedAt: z.date().optional(),
})

const userRestrictionsSchema = z.object({
  messagingDisabled: z.boolean().default(false),
  messagingDisabledUntil: z.date().optional(),
  
  swipingDisabled: z.boolean().default(false),
  swipingDisabledUntil: z.date().optional(),
  
  shadowBanned: z.boolean().default(false),
  shadowBannedUntil: z.date().optional(),
  
  photoUploadDisabled: z.boolean().default(false),
})

export const userFlagsSchema = withTimestamps({
  _id: objectIdSchema.optional(),
  userId: objectIdSchema,
  
  flags: userFlagsDataSchema.default({}),
  restrictions: userRestrictionsSchema.default({}),
})

export type UserFlagsDocument = z.infer<typeof userFlagsSchema>

export const USER_FLAGS_INDEXES = [
  { key: { userId: 1 }, name: 'user_flags_user_unique', unique: true },
  { key: { 'flags.isVIP': 1 }, name: 'user_flags_vip_idx', partialFilterExpression: { 'flags.isVIP': true } },
  { key: { 'flags.isSuspectedBot': 1, 'flags.botScore': -1 }, name: 'user_flags_bot_idx' },
  { key: { 'flags.isRepeatOffender': 1 }, name: 'user_flags_offender_idx' },
  { key: { 'flags.trustScore': 1 }, name: 'user_flags_trust_idx' },
]

// ============================================================================
// User Support Notes Collection
// ============================================================================

export const userSupportNoteSchema = withTimestamps({
  _id: objectIdSchema.optional(),
  userId: objectIdSchema,
  
  type: z.enum(['general', 'escalation', 'vip', 'warning', 'follow_up']).default('general'),
  content: z.string().max(5000),
  
  relatedTicketId: objectIdSchema.optional(),
  relatedReportId: objectIdSchema.optional(),
  
  authorId: objectIdSchema,
  authorEmail: z.string().email(),
  
  followUpDate: z.date().optional(),
  followUpAssignedTo: objectIdSchema.optional(),
  isFollowedUp: z.boolean().default(false),
  
  isInternal: z.boolean().default(true),
})

export type UserSupportNoteDocument = z.infer<typeof userSupportNoteSchema>

export const USER_SUPPORT_NOTE_INDEXES = [
  { key: { userId: 1, createdAt: -1 }, name: 'support_note_user_idx' },
  { key: { authorId: 1, createdAt: -1 }, name: 'support_note_author_idx' },
  { key: { followUpDate: 1 }, name: 'support_note_followup_idx', partialFilterExpression: { isFollowedUp: false } },
  { key: { type: 1, createdAt: -1 }, name: 'support_note_type_idx' },
]

// ============================================================================
// App Errors Collection
// ============================================================================

export const appErrorSchema = withTimestamps({
  _id: objectIdSchema.optional(),
  
  errorHash: z.string().min(1),
  errorType: z.enum(['crash', 'exception', 'network', 'validation', 'timeout']),
  
  message: z.string().max(1000),
  stack: z.string().optional(),
  componentStack: z.string().optional(),
  
  userId: objectIdSchema.optional(),
  sessionId: z.string().optional(),
  
  platform: z.enum(['web', 'ios', 'android']),
  appVersion: z.string(),
  osVersion: z.string().optional(),
  deviceModel: z.string().optional(),
  
  endpoint: z.string().optional(),
  statusCode: z.number().int().optional(),
  responseTime: z.number().int().nonnegative().optional(),
  
  occurrenceCount: z.number().int().positive().default(1),
  firstOccurredAt: z.date(),
  lastOccurredAt: z.date(),
  
  status: z.enum(['new', 'investigating', 'resolved', 'ignored']).default('new'),
  resolvedAt: z.date().optional(),
  resolvedBy: objectIdSchema.optional(),
  notes: z.string().optional(),
})

export type AppErrorDocument = z.infer<typeof appErrorSchema>

export const APP_ERROR_INDEXES = [
  { key: { errorHash: 1 }, name: 'app_error_hash_unique', unique: true },
  { key: { status: 1, lastOccurredAt: -1 }, name: 'app_error_status_idx' },
  { key: { platform: 1, errorType: 1, lastOccurredAt: -1 }, name: 'app_error_platform_idx' },
  { key: { appVersion: 1, lastOccurredAt: -1 }, name: 'app_error_version_idx' },
  { key: { createdAt: 1 }, name: 'app_error_ttl', expireAfterSeconds: 7776000 }, // 90 days
]

// ============================================================================
// Admin Audit Log Collection (Enhanced)
// ============================================================================

export const adminAuditLogSchema = withTimestamps({
  _id: objectIdSchema.optional(),
  
  actorId: objectIdSchema,
  actorEmail: z.string().email(),
  actorRole: z.enum(['superadmin', 'moderator', 'support', 'analyst']),
  
  action: z.string().min(1),
  category: z.enum(['user', 'content', 'payment', 'system', 'data', 'security']),
  
  targetType: z.enum(['user', 'profile', 'report', 'payment', 'config', 'experiment', 'campaign']).optional(),
  targetId: objectIdSchema.optional(),
  
  changes: z.object({
    before: z.record(z.string(), z.any()).optional(),
    after: z.record(z.string(), z.any()).optional(),
    diff: z.record(z.string(), z.object({ old: z.any(), new: z.any() })).optional(),
  }).default({}),
  
  reason: z.string().optional(),
  notes: z.string().optional(),
  
  requestId: z.string(),
  ip: z.string(),
  userAgent: z.string(),
  
  entryHash: z.string(),
  previousHash: z.string(),
  
  occurredAt: z.date(),
})

export type AdminAuditLogDocument = z.infer<typeof adminAuditLogSchema>

export const ADMIN_AUDIT_LOG_INDEXES = [
  { key: { entryHash: 1 }, name: 'audit_hash_unique', unique: true },
  { key: { actorId: 1, occurredAt: -1 }, name: 'audit_actor_idx' },
  { key: { action: 1, occurredAt: -1 }, name: 'audit_action_idx' },
  { key: { targetType: 1, targetId: 1, occurredAt: -1 }, name: 'audit_target_idx' },
  { key: { category: 1, occurredAt: -1 }, name: 'audit_category_idx' },
  { key: { occurredAt: -1 }, name: 'audit_occurred_idx' },
]

// ============================================================================
// Collection Names Export
// ============================================================================

export const ADMIN_COLLECTIONS = {
  EXPERIMENTS: 'experiments',
  EXPERIMENT_ASSIGNMENTS: 'experiment_assignments',
  SUPPORT_TICKETS: 'support_tickets',
  EMAIL_CAMPAIGNS: 'email_campaigns',
  EMAIL_EVENTS: 'email_events',
  GDPR_DATA_EXPORTS: 'gdpr_data_exports',
  USER_FLAGS: 'user_flags',
  USER_SUPPORT_NOTES: 'user_support_notes',
  APP_ERRORS: 'app_errors',
  ADMIN_AUDIT_LOG: 'admin_audit_log',
} as const

export type AdminCollectionName = typeof ADMIN_COLLECTIONS[keyof typeof ADMIN_COLLECTIONS]
