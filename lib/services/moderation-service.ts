/**
 * Moderation Service
 * Priority scoring, escalation workflows, photo verification queue, and appeal processing
 */

import { ObjectId, type Db, type Collection, type Filter } from 'mongodb'
import { getMongoDb } from '@/lib/mongodb'
import crypto from 'crypto'

// ============================================================================
// Types
// ============================================================================

export type ReportCategory = 
  | 'harassment'
  | 'fake_profile'
  | 'inappropriate_content'
  | 'scam'
  | 'underage'
  | 'violence'
  | 'hate_speech'
  | 'spam'
  | 'copyright'
  | 'other'

export type ReportPriority = 'critical' | 'high' | 'medium' | 'low'

export type ReportStatus = 
  | 'open'
  | 'triaged'
  | 'in_progress'
  | 'pending_response'
  | 'escalated'
  | 'resolved'
  | 'dismissed'

export type ModerationAction =
  | 'warn'
  | 'mute'
  | 'suspend'
  | 'ban'
  | 'shadowban'
  | 'photo_remove'
  | 'bio_reset'
  | 'flag_add'
  | 'appeal_approved'
  | 'appeal_denied'
  | 'no_action'

export interface Report {
  _id: ObjectId
  reporterId: string
  reportedUserId: string
  reportedContentId?: string
  reportedContentType?: 'message' | 'photo' | 'bio' | 'profile'
  category: ReportCategory
  subcategory?: string
  description?: string
  evidence?: Array<{
    type: 'screenshot' | 'message' | 'url'
    url?: string
    text?: string
    capturedAt: Date
  }>
  priority: ReportPriority
  priorityScore: number
  status: ReportStatus
  assignedTo?: string
  tags?: string[]
  duplicateOf?: ObjectId
  relatedReports?: ObjectId[]
  escalation?: {
    level: 'standard' | 'senior' | 'legal'
    reason: string
    escalatedAt: Date
    escalatedBy: string
  }
  resolution?: {
    action: ModerationAction
    reason: string
    notes?: string
    resolvedBy: string
    resolvedAt: Date
    appealable: boolean
  }
  slaDeadline: Date
  slaBreach: boolean
  createdAt: Date
  updatedAt: Date
}

export interface ModerationQueue {
  reports: Report[]
  totalCount: number
  byCritical: number
  byHigh: number
  byMedium: number
  byLow: number
  slaBreach: number
}

export interface PhotoVerificationItem {
  userId: string
  photoUrl: string
  uploadedAt: Date
  selfieUrl?: string
  selfieUploadedAt?: Date
  status: 'pending' | 'approved' | 'rejected' | 'needs_resubmit'
  rejectionReason?: string
  assignedTo?: string
  reviewedAt?: Date
  reviewedBy?: string
}

export interface Appeal {
  _id: ObjectId
  userId: string
  moderationActionId: ObjectId
  originalAction: ModerationAction
  reason: string
  evidence?: string[]
  status: 'pending' | 'in_review' | 'approved' | 'denied'
  assignedTo?: string
  decision?: {
    result: 'upheld' | 'overturned' | 'modified'
    newAction?: ModerationAction
    reason: string
    decidedBy: string
    decidedAt: Date
  }
  createdAt: Date
  updatedAt: Date
}

export interface PriorityFactors {
  categoryWeight: number
  recidivismMultiplier: number
  verifiedReporterBonus: number
  evidenceBonus: number
  reportVelocityMultiplier: number
  userTrustPenalty: number
  financialRisk: number
}

// ============================================================================
// Priority Scoring Engine
// ============================================================================

/**
 * Category base weights for priority scoring
 */
const CATEGORY_WEIGHTS: Record<ReportCategory, number> = {
  underage: 100,        // Immediate escalation required
  violence: 90,         // Safety-critical
  scam: 80,             // Financial harm
  hate_speech: 75,      // Policy violation
  harassment: 60,       // User safety
  fake_profile: 50,     // Trust & safety
  inappropriate_content: 40,
  spam: 30,
  copyright: 25,
  other: 20,
}

/**
 * SLA deadlines by priority (in hours)
 */
const SLA_HOURS: Record<ReportPriority, number> = {
  critical: 2,
  high: 8,
  medium: 24,
  low: 72,
}

/**
 * Calculate priority score for a report
 */
export async function calculatePriorityScore(
  db: Db,
  report: {
    reporterId: string
    reportedUserId: string
    category: ReportCategory
    evidence?: Array<{ type: string }>
  }
): Promise<{ score: number; priority: ReportPriority; factors: PriorityFactors }> {
  const usersCollection = db.collection('users')
  const profilesCollection = db.collection('profiles')
  const reportsCollection = db.collection('reports')
  const moderationActionsCollection = db.collection('moderation_actions')
  const subscriptionsCollection = db.collection('subscriptions')

  // 1. Base category weight
  const categoryWeight = CATEGORY_WEIGHTS[report.category]

  // 2. Check reporter's trust (verified reporters get bonus)
  const reporterProfile = await profilesCollection.findOne(
    { userId: report.reporterId },
    { projection: { verificationStatus: 1 } }
  )
  const verifiedReporterBonus =
    reporterProfile?.verificationStatus?.selfie || reporterProfile?.verificationStatus?.id
      ? 10
      : 0

  // 3. Check evidence quality
  const evidenceBonus = report.evidence?.length
    ? Math.min(report.evidence.length * 5, 20)
    : 0

  // 4. Recidivism check (has this user been reported/actioned before?)
  const [priorReports, priorActions] = await Promise.all([
    reportsCollection.countDocuments({
      reportedUserId: report.reportedUserId,
      status: { $in: ['resolved'] },
      'resolution.action': { $nin: ['no_action', 'appeal_approved'] },
    }),
    moderationActionsCollection.countDocuments({
      targetUserId: report.reportedUserId,
      action: { $in: ['warn', 'mute', 'suspend'] },
    }),
  ])
  const recidivismMultiplier = 1 + Math.min(priorReports + priorActions, 5) * 0.15

  // 5. Report velocity (many reports in short time = urgent)
  const recentReportsCount = await reportsCollection.countDocuments({
    reportedUserId: report.reportedUserId,
    createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
  })
  const reportVelocityMultiplier = recentReportsCount > 3 ? 1.5 : recentReportsCount > 1 ? 1.2 : 1

  // 6. Target user's trust score penalty
  const targetProfile = await profilesCollection.findOne(
    { userId: report.reportedUserId },
    { projection: { trustScore: 1 } }
  )
  const trustScore = targetProfile?.trustScore ?? 50
  const userTrustPenalty = trustScore < 30 ? 15 : trustScore < 50 ? 5 : 0

  // 7. Financial risk (premium subscribers or recent payments)
  const hasSubscription = await subscriptionsCollection.findOne({
    userId: report.reportedUserId,
    status: 'active',
  })
  const financialRisk = hasSubscription ? -5 : 0 // Slightly lower priority if paying customer (more due process)

  // Calculate final score
  const baseScore =
    categoryWeight + verifiedReporterBonus + evidenceBonus + userTrustPenalty + financialRisk
  const finalScore = Math.round(baseScore * recidivismMultiplier * reportVelocityMultiplier)

  // Determine priority tier
  let priority: ReportPriority
  if (finalScore >= 80 || report.category === 'underage') {
    priority = 'critical'
  } else if (finalScore >= 60) {
    priority = 'high'
  } else if (finalScore >= 35) {
    priority = 'medium'
  } else {
    priority = 'low'
  }

  return {
    score: finalScore,
    priority,
    factors: {
      categoryWeight,
      recidivismMultiplier,
      verifiedReporterBonus,
      evidenceBonus,
      reportVelocityMultiplier,
      userTrustPenalty,
      financialRisk,
    },
  }
}

// ============================================================================
// Report Management
// ============================================================================

/**
 * Create a new report with automatic priority scoring
 */
export async function createReport(input: {
  reporterId: string
  reportedUserId: string
  reportedContentId?: string
  reportedContentType?: 'message' | 'photo' | 'bio' | 'profile'
  category: ReportCategory
  subcategory?: string
  description?: string
  evidence?: Array<{ type: 'screenshot' | 'message' | 'url'; url?: string; text?: string }>
}): Promise<Report> {
  const db = await getMongoDb()
  const now = new Date()

  // Calculate priority score
  const { score, priority, factors } = await calculatePriorityScore(db, input)

  // Calculate SLA deadline
  const slaDeadline = new Date(now.getTime() + SLA_HOURS[priority] * 60 * 60 * 1000)

  // Check for duplicates (same reporter + reported user + category in last 24h)
  const existingReport = await db.collection<Report>('reports').findOne({
    reporterId: input.reporterId,
    reportedUserId: input.reportedUserId,
    category: input.category,
    createdAt: { $gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) },
    status: { $nin: ['resolved', 'dismissed'] },
  })

  if (existingReport) {
    // Update existing report with new evidence
    await db.collection<Report>('reports').updateOne(
      { _id: existingReport._id },
      {
        $push: {
          evidence: { $each: input.evidence?.map((e) => ({ ...e, capturedAt: now })) || [] },
        },
        $set: { updatedAt: now },
      }
    )
    return existingReport
  }

  const report: Omit<Report, '_id'> = {
    reporterId: input.reporterId,
    reportedUserId: input.reportedUserId,
    reportedContentId: input.reportedContentId,
    reportedContentType: input.reportedContentType,
    category: input.category,
    subcategory: input.subcategory,
    description: input.description,
    evidence: input.evidence?.map((e) => ({ ...e, capturedAt: now })),
    priority,
    priorityScore: score,
    status: 'open',
    tags: [],
    slaDeadline,
    slaBreach: false,
    createdAt: now,
    updatedAt: now,
  }

  const result = await db.collection<Report>('reports').insertOne(report as Report)

  // Auto-escalate critical reports
  if (priority === 'critical') {
    await escalateReport(result.insertedId.toString(), {
      level: 'senior',
      reason: `Auto-escalated: ${input.category} report with priority score ${score}`,
      escalatedBy: 'system',
    })
  }

  // Log to audit
  await logModerationAudit(db, {
    action: 'report_created',
    reportId: result.insertedId.toString(),
    actorId: input.reporterId,
    targetUserId: input.reportedUserId,
    metadata: { category: input.category, priority, score },
  })

  return { _id: result.insertedId, ...report } as Report
}

/**
 * Get the moderation queue with filtering and sorting
 */
export async function getModerationQueue(options: {
  status?: ReportStatus[]
  priority?: ReportPriority[]
  category?: ReportCategory[]
  assignedTo?: string
  slaBreach?: boolean
  page?: number
  limit?: number
}): Promise<ModerationQueue> {
  const db = await getMongoDb()
  const reportsCollection = db.collection<Report>('reports')

  const filter: Filter<Report> = {}

  if (options.status?.length) {
    filter.status = { $in: options.status }
  } else {
    filter.status = { $nin: ['resolved', 'dismissed'] }
  }

  if (options.priority?.length) {
    filter.priority = { $in: options.priority }
  }

  if (options.category?.length) {
    filter.category = { $in: options.category }
  }

  if (options.assignedTo !== undefined) {
    filter.assignedTo = options.assignedTo || { $exists: false }
  }

  if (options.slaBreach) {
    filter.slaBreach = true
  }

  const page = options.page || 1
  const limit = options.limit || 50
  const skip = (page - 1) * limit

  // Mark SLA breaches
  await reportsCollection.updateMany(
    {
      status: { $nin: ['resolved', 'dismissed'] },
      slaDeadline: { $lt: new Date() },
      slaBreach: { $ne: true },
    },
    { $set: { slaBreach: true } }
  )

  const [reports, totalCount, byCritical, byHigh, byMedium, byLow, slaBreachCount] =
    await Promise.all([
      reportsCollection
        .find(filter)
        .sort({ slaBreach: -1, priorityScore: -1, createdAt: 1 })
        .skip(skip)
        .limit(limit)
        .toArray(),
      reportsCollection.countDocuments(filter),
      reportsCollection.countDocuments({ ...filter, priority: 'critical' }),
      reportsCollection.countDocuments({ ...filter, priority: 'high' }),
      reportsCollection.countDocuments({ ...filter, priority: 'medium' }),
      reportsCollection.countDocuments({ ...filter, priority: 'low' }),
      reportsCollection.countDocuments({ ...filter, slaBreach: true }),
    ])

  return {
    reports,
    totalCount,
    byCritical,
    byHigh,
    byMedium,
    byLow,
    slaBreach: slaBreachCount,
  }
}

/**
 * Assign a report to a moderator
 */
export async function assignReport(
  reportId: string,
  moderatorId: string,
  actorId: string
): Promise<void> {
  const db = await getMongoDb()

  const result = await db.collection<Report>('reports').findOneAndUpdate(
    { _id: new ObjectId(reportId) },
    {
      $set: {
        assignedTo: moderatorId,
        status: 'in_progress',
        updatedAt: new Date(),
      },
    },
    { returnDocument: 'after' }
  )

  if (result) {
    await logModerationAudit(db, {
      action: 'report_assigned',
      reportId,
      actorId,
      targetUserId: result.reportedUserId,
      metadata: { assignedTo: moderatorId },
    })
  }
}

/**
 * Escalate a report to senior moderator or legal
 */
export async function escalateReport(
  reportId: string,
  escalation: {
    level: 'senior' | 'legal'
    reason: string
    escalatedBy: string
  }
): Promise<void> {
  const db = await getMongoDb()
  const now = new Date()

  const result = await db.collection<Report>('reports').findOneAndUpdate(
    { _id: new ObjectId(reportId) },
    {
      $set: {
        status: 'escalated',
        escalation: {
          level: escalation.level,
          reason: escalation.reason,
          escalatedAt: now,
          escalatedBy: escalation.escalatedBy,
        },
        updatedAt: now,
      },
    },
    { returnDocument: 'after' }
  )

  if (result) {
    await logModerationAudit(db, {
      action: 'report_escalated',
      reportId,
      actorId: escalation.escalatedBy,
      targetUserId: result.reportedUserId,
      metadata: { level: escalation.level, reason: escalation.reason },
    })

    // Notify appropriate team
    // await sendModerationNotification(escalation.level, reportId, escalation.reason)
  }
}

/**
 * Resolve a report with action
 */
export async function resolveReport(
  reportId: string,
  resolution: {
    action: ModerationAction
    reason: string
    notes?: string
    resolvedBy: string
  }
): Promise<void> {
  const db = await getMongoDb()
  const now = new Date()

  const report = await db.collection<Report>('reports').findOne({
    _id: new ObjectId(reportId),
  })

  if (!report) {
    throw new Error('Report not found')
  }

  // Take action on the reported user
  if (resolution.action !== 'no_action') {
    await takeModerationAction({
      targetUserId: report.reportedUserId,
      action: resolution.action,
      reason: resolution.reason,
      actorId: resolution.resolvedBy,
      reportId,
    })
  }

  // Update report
  await db.collection<Report>('reports').updateOne(
    { _id: new ObjectId(reportId) },
    {
      $set: {
        status: 'resolved',
        resolution: {
          action: resolution.action,
          reason: resolution.reason,
          notes: resolution.notes,
          resolvedBy: resolution.resolvedBy,
          resolvedAt: now,
          appealable: !['no_action', 'warn'].includes(resolution.action),
        },
        updatedAt: now,
      },
    }
  )

  await logModerationAudit(db, {
    action: 'report_resolved',
    reportId,
    actorId: resolution.resolvedBy,
    targetUserId: report.reportedUserId,
    metadata: { action: resolution.action, reason: resolution.reason },
  })
}

// ============================================================================
// Moderation Actions
// ============================================================================

/**
 * Take a moderation action against a user
 */
export async function takeModerationAction(input: {
  targetUserId: string
  action: ModerationAction
  reason: string
  actorId: string
  reportId?: string
  duration?: number // milliseconds
  metadata?: Record<string, unknown>
}): Promise<string> {
  const db = await getMongoDb()
  const now = new Date()

  // Calculate expiry if duration-based
  const expiresAt = input.duration
    ? new Date(now.getTime() + input.duration)
    : undefined

  // Create moderation action record
  const moderationAction = {
    targetUserId: input.targetUserId,
    action: input.action,
    reason: input.reason,
    actorId: input.actorId,
    reportId: input.reportId,
    expiresAt,
    metadata: input.metadata,
    active: true,
    createdAt: now,
    updatedAt: now,
  }

  const result = await db.collection('moderation_actions').insertOne(moderationAction)

  // Apply action to user
  switch (input.action) {
    case 'warn':
      await db.collection('users').updateOne(
        { _id: new ObjectId(input.targetUserId) },
        {
          $push: {
            warnings: {
              reason: input.reason,
              issuedAt: now,
              issuedBy: input.actorId,
            },
          } as any,
          $set: { updatedAt: now },
        }
      )
      break

    case 'mute':
      await db.collection('users').updateOne(
        { _id: new ObjectId(input.targetUserId) },
        {
          $set: {
            'restrictions.canMessage': false,
            'restrictions.muteExpiresAt': expiresAt,
            updatedAt: now,
          },
        }
      )
      break

    case 'suspend':
      await db.collection('users').updateOne(
        { _id: new ObjectId(input.targetUserId) },
        {
          $set: {
            status: 'suspended',
            'restrictions.suspendExpiresAt': expiresAt,
            updatedAt: now,
          },
        }
      )
      break

    case 'ban':
      await db.collection('users').updateOne(
        { _id: new ObjectId(input.targetUserId) },
        {
          $set: {
            status: 'banned',
            bannedAt: now,
            bannedBy: input.actorId,
            banReason: input.reason,
            updatedAt: now,
          },
        }
      )
      // Cancel any active subscriptions
      await db.collection('subscriptions').updateMany(
        { userId: input.targetUserId, status: 'active' },
        { $set: { status: 'cancelled', cancellationReason: 'account_banned', updatedAt: now } }
      )
      break

    case 'shadowban':
      await db.collection('users').updateOne(
        { _id: new ObjectId(input.targetUserId) },
        {
          $set: {
            'restrictions.shadowbanned': true,
            updatedAt: now,
          },
        }
      )
      break

    case 'photo_remove':
      if (input.metadata?.photoId) {
        await db.collection('profiles').updateOne(
          { userId: input.targetUserId },
          {
            $pull: { mediaGallery: { id: input.metadata.photoId } } as any,
            $set: { updatedAt: now },
          }
        )
      }
      break

    case 'bio_reset':
      await db.collection('profiles').updateOne(
        { userId: input.targetUserId },
        {
          $set: {
            bio: '',
            bioReason: 'Removed by moderation',
            updatedAt: now,
          },
        }
      )
      break

    case 'flag_add':
      if (input.metadata?.flagType) {
        await db.collection('user_flags').updateOne(
          { userId: input.targetUserId },
          {
            $set: {
              [`flags.${input.metadata.flagType}`]: {
                active: true,
                addedAt: now,
                addedBy: input.actorId,
                reason: input.reason,
              },
              updatedAt: now,
            },
            $setOnInsert: { createdAt: now },
          },
          { upsert: true }
        )
      }
      break
  }

  // Update user's trust score
  await updateTrustScoreAfterAction(db, input.targetUserId, input.action)

  // Log to audit
  await logModerationAudit(db, {
    action: `action_${input.action}`,
    reportId: input.reportId,
    actorId: input.actorId,
    targetUserId: input.targetUserId,
    metadata: { duration: input.duration, expiresAt },
  })

  // Notify user
  // await sendModerationNotificationToUser(input.targetUserId, input.action, input.reason)

  return result.insertedId.toString()
}

/**
 * Update trust score after moderation action
 */
async function updateTrustScoreAfterAction(
  db: Db,
  userId: string,
  action: ModerationAction
): Promise<void> {
  const penalties: Record<ModerationAction, number> = {
    warn: -5,
    mute: -15,
    suspend: -30,
    ban: -100,
    shadowban: -50,
    photo_remove: -10,
    bio_reset: -10,
    flag_add: -20,
    appeal_approved: 10,
    appeal_denied: -5,
    no_action: 0,
  }

  const penalty = penalties[action]
  if (penalty === 0) return

  await db.collection('profiles').updateOne(
    { userId },
    {
      $inc: { trustScore: penalty },
      $set: { updatedAt: new Date() },
    }
  )

  // Ensure score stays within bounds
  await db.collection('profiles').updateOne(
    { userId, trustScore: { $lt: 0 } },
    { $set: { trustScore: 0 } }
  )

  await db.collection('profiles').updateOne(
    { userId, trustScore: { $gt: 100 } },
    { $set: { trustScore: 100 } }
  )
}

// ============================================================================
// Photo Verification Queue
// ============================================================================

/**
 * Get photo verification queue
 */
export async function getPhotoVerificationQueue(options: {
  status?: 'pending' | 'approved' | 'rejected' | 'needs_resubmit'
  assignedTo?: string
  page?: number
  limit?: number
}): Promise<{ items: PhotoVerificationItem[]; totalCount: number }> {
  const db = await getMongoDb()

  const filter: Filter<PhotoVerificationItem> = {}

  if (options.status) {
    filter.status = options.status
  } else {
    filter.status = 'pending'
  }

  if (options.assignedTo !== undefined) {
    filter.assignedTo = options.assignedTo || { $exists: false }
  }

  const page = options.page || 1
  const limit = options.limit || 50
  const skip = (page - 1) * limit

  const [items, totalCount] = await Promise.all([
    db
      .collection<PhotoVerificationItem>('liveness_sessions')
      .find(filter)
      .sort({ uploadedAt: 1 })
      .skip(skip)
      .limit(limit)
      .toArray(),
    db.collection<PhotoVerificationItem>('liveness_sessions').countDocuments(filter),
  ])

  return { items, totalCount }
}

/**
 * Review a photo verification
 */
export async function reviewPhotoVerification(
  userId: string,
  decision: {
    approved: boolean
    rejectionReason?: string
    reviewedBy: string
  }
): Promise<void> {
  const db = await getMongoDb()
  const now = new Date()

  await db.collection('liveness_sessions').updateOne(
    { userId, status: 'pending' },
    {
      $set: {
        status: decision.approved ? 'passed' : 'failed',
        rejectionReason: decision.rejectionReason,
        reviewedAt: now,
        reviewedBy: decision.reviewedBy,
        updatedAt: now,
      },
    }
  )

  if (decision.approved) {
    // Update profile verification status
    await db.collection('profiles').updateOne(
      { userId },
      {
        $set: {
          'verificationStatus.selfie': true,
          'verificationStatus.selfieVerifiedAt': now,
          updatedAt: now,
        },
      }
    )

    // Boost trust score
    await db.collection('profiles').updateOne(
      { userId },
      { $inc: { trustScore: 10 } }
    )
  }

  await logModerationAudit(db, {
    action: decision.approved ? 'photo_verification_approved' : 'photo_verification_rejected',
    actorId: decision.reviewedBy,
    targetUserId: userId,
    metadata: { reason: decision.rejectionReason },
  })
}

// ============================================================================
// Appeals
// ============================================================================

/**
 * Submit an appeal
 */
export async function submitAppeal(input: {
  userId: string
  moderationActionId: string
  reason: string
  evidence?: string[]
}): Promise<Appeal> {
  const db = await getMongoDb()
  const now = new Date()

  // Get the original action
  const originalActionDoc = await db.collection('moderation_actions').findOne({
    _id: new ObjectId(input.moderationActionId),
    targetUserId: input.userId,
  })

  if (!originalActionDoc) {
    throw new Error('Moderation action not found')
  }

  // Check if already appealed
  const existingAppeal = await db.collection<Appeal>('appeals').findOne({
    userId: input.userId,
    moderationActionId: new ObjectId(input.moderationActionId),
    status: { $in: ['pending', 'in_review'] },
  })

  if (existingAppeal) {
    throw new Error('Appeal already submitted')
  }

  const appeal: Omit<Appeal, '_id'> = {
    userId: input.userId,
    moderationActionId: new ObjectId(input.moderationActionId),
    originalAction: originalActionDoc.action,
    reason: input.reason,
    evidence: input.evidence,
    status: 'pending',
    createdAt: now,
    updatedAt: now,
  }

  const result = await db.collection<Appeal>('appeals').insertOne(appeal as Appeal)

  await logModerationAudit(db, {
    action: 'appeal_submitted',
    actorId: input.userId,
    targetUserId: input.userId,
    metadata: { moderationActionId: input.moderationActionId },
  })

  return { _id: result.insertedId, ...appeal } as Appeal
}

/**
 * Process an appeal
 */
export async function processAppeal(
  appealId: string,
  decision: {
    result: 'upheld' | 'overturned' | 'modified'
    newAction?: ModerationAction
    reason: string
    decidedBy: string
  }
): Promise<void> {
  const db = await getMongoDb()
  const now = new Date()

  const appeal = await db.collection<Appeal>('appeals').findOne({
    _id: new ObjectId(appealId),
  })

  if (!appeal) {
    throw new Error('Appeal not found')
  }

  // Update appeal
  await db.collection<Appeal>('appeals').updateOne(
    { _id: new ObjectId(appealId) },
    {
      $set: {
        status: decision.result === 'upheld' ? 'denied' : 'approved',
        decision: {
          result: decision.result,
          newAction: decision.newAction,
          reason: decision.reason,
          decidedBy: decision.decidedBy,
          decidedAt: now,
        },
        updatedAt: now,
      },
    }
  )

  // If overturned or modified, reverse or adjust the original action
  if (decision.result !== 'upheld') {
    await reverseOrModifyAction(
      db,
      appeal.userId,
      appeal.moderationActionId.toString(),
      decision.result === 'overturned' ? null : decision.newAction,
      decision.decidedBy
    )
  }

  await logModerationAudit(db, {
    action: `appeal_${decision.result}`,
    actorId: decision.decidedBy,
    targetUserId: appeal.userId,
    metadata: { appealId, result: decision.result, newAction: decision.newAction },
  })
}

/**
 * Reverse or modify a moderation action
 */
async function reverseOrModifyAction(
  db: Db,
  userId: string,
  moderationActionId: string,
  newAction: ModerationAction | null | undefined,
  actorId: string
): Promise<void> {
  const originalAction = await db.collection('moderation_actions').findOne({
    _id: new ObjectId(moderationActionId),
  })

  if (!originalAction) return

  // Deactivate original action
  await db.collection('moderation_actions').updateOne(
    { _id: new ObjectId(moderationActionId) },
    {
      $set: {
        active: false,
        reversedAt: new Date(),
        reversedBy: actorId,
        updatedAt: new Date(),
      },
    }
  )

  // Reverse effects based on original action
  switch (originalAction.action) {
    case 'mute':
      await db.collection('users').updateOne(
        { _id: new ObjectId(userId) },
        {
          $set: {
            'restrictions.canMessage': true,
            'restrictions.muteExpiresAt': null,
          },
        }
      )
      break

    case 'suspend':
      await db.collection('users').updateOne(
        { _id: new ObjectId(userId) },
        {
          $set: {
            status: 'active',
            'restrictions.suspendExpiresAt': null,
          },
        }
      )
      break

    case 'ban':
      await db.collection('users').updateOne(
        { _id: new ObjectId(userId) },
        {
          $set: {
            status: 'active',
            bannedAt: null,
            bannedBy: null,
            banReason: null,
          },
        }
      )
      break

    case 'shadowban':
      await db.collection('users').updateOne(
        { _id: new ObjectId(userId) },
        { $set: { 'restrictions.shadowbanned': false } }
      )
      break
  }

  // Restore trust score
  await db.collection('profiles').updateOne(
    { userId },
    { $inc: { trustScore: 20 } } // Partial restoration
  )

  // Apply new action if modified (not fully overturned)
  if (newAction && newAction !== 'no_action') {
    await takeModerationAction({
      targetUserId: userId,
      action: newAction,
      reason: 'Modified action after appeal',
      actorId,
    })
  }
}

// ============================================================================
// Audit Logging
// ============================================================================

/**
 * Log moderation action to audit trail
 */
async function logModerationAudit(
  db: Db,
  data: {
    action: string
    reportId?: string
    actorId: string
    targetUserId: string
    metadata?: Record<string, unknown>
  }
): Promise<void> {
  const now = new Date()

  // Get previous hash for chain integrity
  const lastLog = await db
    .collection('admin_audit_log')
    .findOne({}, { sort: { createdAt: -1 }, projection: { hash: 1 } })

  const payload = JSON.stringify({
    ...data,
    timestamp: now.toISOString(),
    previousHash: lastLog?.hash || null,
  })

  const hash = crypto.createHash('sha256').update(payload).digest('hex')

  await db.collection('admin_audit_log').insertOne({
    actor: data.actorId,
    targetType: 'user',
    targetId: data.targetUserId,
    action: data.action,
    context: {
      reportId: data.reportId,
      ...data.metadata,
    },
    outcome: 'success',
    hash,
    previousHash: lastLog?.hash || null,
    createdAt: now,
    updatedAt: now,
  })
}

// ============================================================================
// Auto-Moderation Rules
// ============================================================================

/**
 * Check content against auto-moderation rules
 */
export async function checkAutoModeration(
  content: string,
  contentType: 'message' | 'bio' | 'prompt'
): Promise<{
  shouldBlock: boolean
  shouldFlag: boolean
  matchedRules: string[]
  severity: 'none' | 'low' | 'medium' | 'high'
}> {
  const db = await getMongoDb()

  // Get active rules
  const rules = await db
    .collection('auto_moderation_rules')
    .find({ active: true, contentTypes: contentType })
    .toArray()

  const matchedRules: string[] = []
  let maxSeverity: 'none' | 'low' | 'medium' | 'high' = 'none'

  for (const rule of rules) {
    let matched = false

    if (rule.type === 'regex') {
      const regex = new RegExp(rule.pattern, rule.flags || 'gi')
      matched = regex.test(content)
    } else if (rule.type === 'exact') {
      matched = content.toLowerCase().includes(rule.pattern.toLowerCase())
    } else if (rule.type === 'wordlist') {
      const words = rule.wordlist as string[]
      matched = words.some((word) =>
        content.toLowerCase().includes(word.toLowerCase())
      )
    }

    if (matched) {
      matchedRules.push(rule.name)
      const severityOrder = ['none', 'low', 'medium', 'high']
      if (severityOrder.indexOf(rule.severity) > severityOrder.indexOf(maxSeverity)) {
        maxSeverity = rule.severity
      }
    }
  }

  return {
    shouldBlock: maxSeverity === 'high',
    shouldFlag: maxSeverity === 'medium' || maxSeverity === 'high',
    matchedRules,
    severity: maxSeverity,
  }
}
