/**
 * GDPR Compliance Service
 * Data export, deletion requests, consent management, and audit trail
 */

import { ObjectId, type Db } from 'mongodb'
import { getMongoDb } from '@/lib/mongodb'
import crypto from 'crypto'

// ============================================================================
// Types
// ============================================================================

export type DataExportStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'expired'

export type DeletionRequestStatus =
  | 'pending'
  | 'approved'
  | 'processing'
  | 'completed'
  | 'rejected'

export interface DataExportRequest {
  _id: ObjectId
  userId: string
  requestedAt: Date
  status: DataExportStatus
  format: 'json' | 'csv'
  collections: string[]
  downloadUrl?: string
  downloadExpiresAt?: Date
  fileSize?: number
  processingStartedAt?: Date
  completedAt?: Date
  failureReason?: string
  createdAt: Date
  updatedAt: Date
}

export interface DeletionRequest {
  _id: ObjectId
  userId: string
  requestedAt: Date
  reason?: string
  status: DeletionRequestStatus
  scheduledDeletionAt: Date
  retentionExemptions: string[]
  approvedBy?: string
  approvedAt?: Date
  rejectedBy?: string
  rejectedAt?: string
  rejectionReason?: string
  deletedAt?: Date
  deletionLog?: {
    collection: string
    documentsDeleted: number
    deletedAt: Date
  }[]
  createdAt: Date
  updatedAt: Date
}

export interface ConsentRecord {
  userId: string
  consentType: 'marketing' | 'analytics' | 'thirdParty' | 'location' | 'pushNotifications'
  granted: boolean
  grantedAt?: Date
  revokedAt?: Date
  ipAddress?: string
  userAgent?: string
  version: number
}

export interface DataInventory {
  collection: string
  recordCount: number
  fields: string[]
  piiFields: string[]
  retentionPeriodDays: number | null
  description: string
}

// ============================================================================
// Constants
// ============================================================================

/**
 * Collections containing user data with PII field mappings
 */
const USER_DATA_COLLECTIONS: Record<
  string,
  { piiFields: string[]; softDelete?: boolean; retentionDays?: number }
> = {
  users: {
    piiFields: ['email', 'phone', 'ip'],
    softDelete: true,
  },
  profiles: {
    piiFields: [
      'firstName',
      'lastName',
      'displayName',
      'bio',
      'dob',
      'location',
      'mediaGallery',
    ],
    softDelete: true,
  },
  chat_messages: {
    piiFields: ['content', 'mediaUrl'],
    retentionDays: 365,
  },
  chat_threads: {
    piiFields: [],
    retentionDays: 365,
  },
  matches: {
    piiFields: [],
    retentionDays: 730,
  },
  likes: {
    piiFields: [],
    retentionDays: 180,
  },
  payments: {
    piiFields: ['cardLast4', 'billingEmail'],
    retentionDays: 2555, // 7 years for tax compliance
  },
  subscriptions: {
    piiFields: [],
    retentionDays: 2555,
  },
  reports: {
    piiFields: ['description', 'evidence'],
    retentionDays: 2555, // Legal retention
  },
  moderation_actions: {
    piiFields: [],
    retentionDays: 2555,
  },
  liveness_sessions: {
    piiFields: ['selfieUrl', 'idDocUrl'],
    retentionDays: 365,
  },
  user_sessions: {
    piiFields: ['ipAddress', 'userAgent', 'deviceFingerprint'],
    retentionDays: 90,
  },
  activity_logs: {
    piiFields: ['ipAddress'],
    retentionDays: 180,
  },
  notifications: {
    piiFields: ['content'],
    retentionDays: 90,
  },
  support_tickets: {
    piiFields: ['description', 'attachments'],
    retentionDays: 1095, // 3 years
  },
  user_flags: {
    piiFields: [],
    retentionDays: 2555,
  },
  experiment_assignments: {
    piiFields: [],
    retentionDays: 730,
  },
}

/**
 * GDPR data request deadlines (in days)
 */
const GDPR_DEADLINES = {
  exportRequestDays: 30,
  deletionRequestDays: 30,
  deletionGracePeriodDays: 14, // Allow users to cancel
}

// ============================================================================
// Data Export
// ============================================================================

/**
 * Request a data export for a user
 */
export async function requestDataExport(
  userId: string,
  format: 'json' | 'csv' = 'json',
  collections?: string[]
): Promise<DataExportRequest> {
  const db = await getMongoDb()
  const now = new Date()

  // Check for pending request
  const existingRequest = await db.collection<DataExportRequest>('gdpr_data_exports').findOne({
    userId,
    status: { $in: ['pending', 'processing'] },
  })

  if (existingRequest) {
    throw new Error('Export request already in progress')
  }

  // Default to all collections
  const targetCollections = collections || Object.keys(USER_DATA_COLLECTIONS)

  const request: Omit<DataExportRequest, '_id'> = {
    userId,
    requestedAt: now,
    status: 'pending',
    format,
    collections: targetCollections,
    createdAt: now,
    updatedAt: now,
  }

  const result = await db
    .collection<DataExportRequest>('gdpr_data_exports')
    .insertOne(request as DataExportRequest)

  // Log to audit
  await logGdprAudit(db, {
    action: 'data_export_requested',
    userId,
    metadata: { format, collections: targetCollections },
  })

  return { _id: result.insertedId, ...request } as DataExportRequest
}

/**
 * Process a data export request (background job)
 */
export async function processDataExport(requestId: string): Promise<void> {
  const db = await getMongoDb()
  const now = new Date()

  const request = await db.collection<DataExportRequest>('gdpr_data_exports').findOne({
    _id: new ObjectId(requestId),
    status: 'pending',
  })

  if (!request) {
    throw new Error('Export request not found or not pending')
  }

  // Mark as processing
  await db.collection<DataExportRequest>('gdpr_data_exports').updateOne(
    { _id: new ObjectId(requestId) },
    {
      $set: {
        status: 'processing',
        processingStartedAt: now,
        updatedAt: now,
      },
    }
  )

  try {
    const exportData: Record<string, unknown[]> = {}

    // Collect data from each collection
    for (const collectionName of request.collections) {
      const collection = db.collection(collectionName)

      // Find user's documents
      let documents: Record<string, unknown>[] = []

      if (collectionName === 'users') {
        documents = await collection
          .find({ _id: new ObjectId(request.userId) })
          .toArray()
      } else if (collectionName === 'profiles') {
        documents = await collection.find({ userId: request.userId }).toArray()
      } else if (collectionName === 'matches') {
        documents = await collection
          .find({ memberIds: request.userId })
          .toArray()
      } else if (collectionName === 'chat_threads') {
        documents = await collection
          .find({ participantIds: request.userId })
          .toArray()
      } else if (collectionName === 'chat_messages') {
        // Get threads user is in, then messages
        const threads = await db
          .collection('chat_threads')
          .distinct('_id', { participantIds: request.userId })
        documents = await collection.find({ threadId: { $in: threads } }).toArray()
      } else {
        // Default: look for userId or actorId field
        documents = await collection
          .find({
            $or: [
              { userId: request.userId },
              { actorId: request.userId },
              { reporterId: request.userId },
              { targetUserId: request.userId },
            ],
          })
          .toArray()
      }

      // Redact sensitive non-PII fields if present
      exportData[collectionName] = documents.map((doc) =>
        redactInternalFields(doc)
      )
    }

    // Generate export file
    const exportContent =
      request.format === 'json'
        ? JSON.stringify(exportData, null, 2)
        : convertToCsv(exportData)

    // Store to cloud storage (placeholder - implement with your storage provider)
    const { url, expiresAt, size } = await uploadExportFile(
      request.userId,
      requestId,
      exportContent,
      request.format
    )

    // Update request as completed
    await db.collection<DataExportRequest>('gdpr_data_exports').updateOne(
      { _id: new ObjectId(requestId) },
      {
        $set: {
          status: 'completed',
          downloadUrl: url,
          downloadExpiresAt: expiresAt,
          fileSize: size,
          completedAt: new Date(),
          updatedAt: new Date(),
        },
      }
    )

    // Log to audit
    await logGdprAudit(db, {
      action: 'data_export_completed',
      userId: request.userId,
      metadata: {
        requestId,
        collections: request.collections.length,
        fileSize: size,
      },
    })

    // Send notification to user
    // await sendExportReadyNotification(request.userId, url, expiresAt)
  } catch (error: any) {
    // Mark as failed
    await db.collection<DataExportRequest>('gdpr_data_exports').updateOne(
      { _id: new ObjectId(requestId) },
      {
        $set: {
          status: 'failed',
          failureReason: error.message,
          updatedAt: new Date(),
        },
      }
    )

    throw error
  }
}

function redactInternalFields(doc: Record<string, unknown>): Record<string, unknown> {
  const redact = ['passwordHash', 'salt', 'refreshToken', 'internalNotes']
  const result = { ...doc }

  for (const field of redact) {
    delete result[field]
  }

  // Convert ObjectId to string
  if (result._id) {
    result._id = result._id.toString()
  }

  return result
}

function convertToCsv(data: Record<string, unknown[]>): string {
  const lines: string[] = []

  for (const [collection, documents] of Object.entries(data)) {
    if (documents.length === 0) continue

    lines.push(`\n=== ${collection} ===\n`)

    // Get all keys from first document
    const keys = Object.keys(documents[0] as Record<string, unknown>)
    lines.push(keys.join(','))

    for (const doc of documents) {
      const values = keys.map((key) => {
        const value = (doc as Record<string, unknown>)[key]
        if (value === null || value === undefined) return ''
        if (typeof value === 'object') return `"${JSON.stringify(value).replace(/"/g, '""')}"`
        return `"${String(value).replace(/"/g, '""')}"`
      })
      lines.push(values.join(','))
    }
  }

  return lines.join('\n')
}

async function uploadExportFile(
  userId: string,
  requestId: string,
  content: string,
  format: 'json' | 'csv'
): Promise<{ url: string; expiresAt: Date; size: number }> {
  // Placeholder - implement with your cloud storage provider (S3, GCS, etc.)
  // This should:
  // 1. Encrypt the file
  // 2. Upload to secure storage
  // 3. Generate a time-limited signed URL
  // 4. Return the URL and expiration

  const size = Buffer.byteLength(content, 'utf-8')
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7) // 7 day expiry

  // TODO: Replace with actual storage implementation
  const mockUrl = `https://storage.example.com/exports/${userId}/${requestId}.${format}?token=${crypto.randomBytes(16).toString('hex')}`

  return { url: mockUrl, expiresAt, size }
}

// ============================================================================
// Data Deletion (Right to be Forgotten)
// ============================================================================

/**
 * Request account deletion
 */
export async function requestAccountDeletion(
  userId: string,
  reason?: string
): Promise<DeletionRequest> {
  const db = await getMongoDb()
  const now = new Date()

  // Check for existing request
  const existingRequest = await db.collection<DeletionRequest>('deletion_requests').findOne({
    userId,
    status: { $in: ['pending', 'approved', 'processing'] },
  })

  if (existingRequest) {
    throw new Error('Deletion request already pending')
  }

  // Calculate scheduled deletion date (after grace period)
  const scheduledDeletionAt = new Date(now)
  scheduledDeletionAt.setDate(
    scheduledDeletionAt.getDate() + GDPR_DEADLINES.deletionGracePeriodDays
  )

  // Determine retention exemptions (data we must keep for legal/compliance)
  const retentionExemptions: string[] = []

  // Check if user has active subscriptions
  const hasActiveSubscription = await db.collection('subscriptions').findOne({
    userId,
    status: 'active',
  })
  if (hasActiveSubscription) {
    retentionExemptions.push('subscriptions', 'payments')
  }

  // Check if user has unresolved reports against them
  const hasOpenReports = await db.collection('reports').findOne({
    reportedUserId: userId,
    status: { $nin: ['resolved', 'dismissed'] },
  })
  if (hasOpenReports) {
    retentionExemptions.push('reports', 'moderation_actions')
  }

  const request: Omit<DeletionRequest, '_id'> = {
    userId,
    requestedAt: now,
    reason,
    status: 'pending',
    scheduledDeletionAt,
    retentionExemptions,
    createdAt: now,
    updatedAt: now,
  }

  const result = await db
    .collection<DeletionRequest>('deletion_requests')
    .insertOne(request as DeletionRequest)

  // Log to audit
  await logGdprAudit(db, {
    action: 'deletion_requested',
    userId,
    metadata: { reason, scheduledDeletionAt, retentionExemptions },
  })

  // Send confirmation notification
  // await sendDeletionConfirmationNotification(userId, scheduledDeletionAt)

  return { _id: result.insertedId, ...request } as DeletionRequest
}

/**
 * Cancel a deletion request (by user during grace period)
 */
export async function cancelDeletionRequest(userId: string): Promise<void> {
  const db = await getMongoDb()

  const request = await db.collection<DeletionRequest>('deletion_requests').findOne({
    userId,
    status: 'pending',
  })

  if (!request) {
    throw new Error('No pending deletion request found')
  }

  await db.collection<DeletionRequest>('deletion_requests').updateOne(
    { _id: request._id },
    {
      $set: {
        status: 'rejected',
        rejectedBy: userId,
        rejectionReason: 'Cancelled by user',
        updatedAt: new Date(),
      },
    }
  )

  await logGdprAudit(db, {
    action: 'deletion_cancelled',
    userId,
    metadata: {},
  })
}

/**
 * Process account deletion (background job)
 */
export async function processAccountDeletion(requestId: string): Promise<void> {
  const db = await getMongoDb()
  const now = new Date()

  const request = await db.collection<DeletionRequest>('deletion_requests').findOne({
    _id: new ObjectId(requestId),
    status: 'approved',
    scheduledDeletionAt: { $lte: now },
  })

  if (!request) {
    throw new Error('Deletion request not ready for processing')
  }

  // Mark as processing
  await db.collection<DeletionRequest>('deletion_requests').updateOne(
    { _id: new ObjectId(requestId) },
    {
      $set: {
        status: 'processing',
        updatedAt: now,
      },
    }
  )

  const deletionLog: DeletionRequest['deletionLog'] = []

  try {
    // Process each collection
    for (const [collName, config] of Object.entries(USER_DATA_COLLECTIONS)) {
      // Skip exempted collections
      if (request.retentionExemptions.includes(collName)) {
        deletionLog.push({
          collection: collName,
          documentsDeleted: 0,
          deletedAt: new Date(),
        })
        continue
      }

      const collection = db.collection(collName)
      let filter: Record<string, unknown>

      // Build filter based on collection
      if (collName === 'users') {
        filter = { _id: new ObjectId(request.userId) }
      } else if (collName === 'profiles') {
        filter = { userId: request.userId }
      } else if (collName === 'matches') {
        filter = { memberIds: request.userId }
      } else if (collName === 'chat_threads') {
        filter = { participantIds: request.userId }
      } else {
        filter = {
          $or: [
            { userId: request.userId },
            { actorId: request.userId },
            { reporterId: request.userId },
          ],
        }
      }

      if (config.softDelete) {
        // Soft delete: anonymize PII
        const updateDoc: Record<string, unknown> = {
          status: 'deleted',
          deletedAt: now,
        }

        for (const piiField of config.piiFields) {
          updateDoc[piiField] = '[DELETED]'
        }

        const result = await collection.updateMany(filter, { $set: updateDoc })
        deletionLog.push({
          collection: collName,
          documentsDeleted: result.modifiedCount,
          deletedAt: new Date(),
        })
      } else {
        // Hard delete
        const result = await collection.deleteMany(filter)
        deletionLog.push({
          collection: collName,
          documentsDeleted: result.deletedCount,
          deletedAt: new Date(),
        })
      }
    }

    // Mark as completed
    await db.collection<DeletionRequest>('deletion_requests').updateOne(
      { _id: new ObjectId(requestId) },
      {
        $set: {
          status: 'completed',
          deletedAt: now,
          deletionLog,
          updatedAt: now,
        },
      }
    )

    await logGdprAudit(db, {
      action: 'deletion_completed',
      userId: request.userId,
      metadata: { deletionLog },
    })
  } catch (error: any) {
    // Log failure but don't mark as failed - retry later
    console.error('Deletion processing error:', error)
    throw error
  }
}

// ============================================================================
// Consent Management
// ============================================================================

/**
 * Update user consent
 */
export async function updateConsent(
  userId: string,
  consentType: ConsentRecord['consentType'],
  granted: boolean,
  metadata?: { ipAddress?: string; userAgent?: string }
): Promise<void> {
  const db = await getMongoDb()
  const now = new Date()

  // Get current consent record
  const current = await db.collection<ConsentRecord>('consent_records').findOne({
    userId,
    consentType,
  })

  const version = (current?.version || 0) + 1

  await db.collection<ConsentRecord>('consent_records').updateOne(
    { userId, consentType },
    {
      $set: {
        userId,
        consentType,
        granted,
        [granted ? 'grantedAt' : 'revokedAt']: now,
        ipAddress: metadata?.ipAddress,
        userAgent: metadata?.userAgent,
        version,
      },
    },
    { upsert: true }
  )

  await logGdprAudit(db, {
    action: granted ? 'consent_granted' : 'consent_revoked',
    userId,
    metadata: { consentType, version },
  })

  // If revoking marketing consent, unsubscribe from email lists
  if (!granted && consentType === 'marketing') {
    // await unsubscribeFromMarketing(userId)
  }
}

/**
 * Get user's consent records
 */
export async function getConsents(userId: string): Promise<ConsentRecord[]> {
  const db = await getMongoDb()

  return db
    .collection<ConsentRecord>('consent_records')
    .find({ userId })
    .toArray()
}

// ============================================================================
// Data Inventory and Auditing
// ============================================================================

/**
 * Get data inventory (what data we hold about users)
 */
export async function getDataInventory(): Promise<DataInventory[]> {
  const inventory: DataInventory[] = []

  for (const [collName, config] of Object.entries(USER_DATA_COLLECTIONS)) {
    inventory.push({
      collection: collName,
      recordCount: 0, // Would be populated from real counts
      fields: ['_id', 'userId', 'createdAt', 'updatedAt'],
      piiFields: config.piiFields,
      retentionPeriodDays: config.retentionDays || null,
      description: getCollectionDescription(collName),
    })
  }

  return inventory
}

function getCollectionDescription(collection: string): string {
  const descriptions: Record<string, string> = {
    users: 'Core user account data including authentication credentials',
    profiles: 'User profile information visible to other users',
    chat_messages: 'Private messages between matched users',
    chat_threads: 'Conversation metadata between users',
    matches: 'Records of mutual matches between users',
    likes: 'Records of user interactions (likes/passes)',
    payments: 'Payment transaction records',
    subscriptions: 'Subscription status and history',
    reports: 'User-submitted reports about other users',
    moderation_actions: 'Actions taken by moderators on user accounts',
    liveness_sessions: 'Identity verification session data',
    user_sessions: 'Login session and device information',
    activity_logs: 'User activity tracking for analytics',
    notifications: 'Notifications sent to users',
    support_tickets: 'Customer support requests',
    user_flags: 'Internal flags for fraud/trust management',
    experiment_assignments: 'A/B test participation records',
  }

  return descriptions[collection] || 'User-related data'
}

/**
 * Verify audit log chain integrity
 */
export async function verifyAuditLogIntegrity(
  startDate?: Date,
  endDate?: Date
): Promise<{ valid: boolean; brokenAt?: string; details?: string }> {
  const db = await getMongoDb()

  const filter: Record<string, unknown> = {}
  if (startDate || endDate) {
    filter.createdAt = {}
    if (startDate) (filter.createdAt as Record<string, Date>).$gte = startDate
    if (endDate) (filter.createdAt as Record<string, Date>).$lte = endDate
  }

  const logs = await db
    .collection('admin_audit_log')
    .find(filter)
    .sort({ createdAt: 1 })
    .toArray()

  for (let i = 0; i < logs.length; i++) {
    const log = logs[i]
    const expectedPreviousHash = i > 0 ? logs[i - 1].hash : null

    if (log.previousHash !== expectedPreviousHash) {
      return {
        valid: false,
        brokenAt: log._id.toString(),
        details: `Chain broken at log ${log._id}: expected previous hash ${expectedPreviousHash}, got ${log.previousHash}`,
      }
    }

    // Verify this log's hash
    const payload = JSON.stringify({
      actor: log.actor,
      targetType: log.targetType,
      targetId: log.targetId,
      action: log.action,
      context: log.context,
      outcome: log.outcome,
      timestamp: log.createdAt.toISOString(),
      previousHash: log.previousHash,
    })

    const computedHash = crypto.createHash('sha256').update(payload).digest('hex')

    if (computedHash !== log.hash) {
      return {
        valid: false,
        brokenAt: log._id.toString(),
        details: `Hash mismatch at log ${log._id}: stored ${log.hash}, computed ${computedHash}`,
      }
    }
  }

  return { valid: true }
}

// ============================================================================
// Audit Logging
// ============================================================================

async function logGdprAudit(
  db: Db,
  data: {
    action: string
    userId: string
    metadata?: Record<string, unknown>
  }
): Promise<void> {
  const now = new Date()

  // Get previous hash for chain integrity
  const lastLog = await db
    .collection('admin_audit_log')
    .findOne({}, { sort: { createdAt: -1 }, projection: { hash: 1 } })

  const payload = JSON.stringify({
    actor: 'system',
    targetType: 'user',
    targetId: data.userId,
    action: data.action,
    context: data.metadata,
    outcome: 'success',
    timestamp: now.toISOString(),
    previousHash: lastLog?.hash || null,
  })

  const hash = crypto.createHash('sha256').update(payload).digest('hex')

  await db.collection('admin_audit_log').insertOne({
    actor: 'system',
    targetType: 'user',
    targetId: data.userId,
    action: data.action,
    context: data.metadata,
    outcome: 'success',
    hash,
    previousHash: lastLog?.hash || null,
    createdAt: now,
    updatedAt: now,
  })
}

// ============================================================================
// Data Retention Cleanup (Background Job)
// ============================================================================

/**
 * Clean up expired data based on retention policies
 */
export async function runDataRetentionCleanup(): Promise<{
  collectionsProcessed: number
  documentsDeleted: number
}> {
  const db = await getMongoDb()
  let totalDeleted = 0
  let collectionsProcessed = 0

  for (const [collName, config] of Object.entries(USER_DATA_COLLECTIONS)) {
    if (!config.retentionDays) continue

    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - config.retentionDays)

    const collection = db.collection(collName)

    // Only delete documents older than retention period
    const result = await collection.deleteMany({
      createdAt: { $lt: cutoffDate },
      // Don't delete if part of active legal hold
      legalHold: { $ne: true },
    })

    totalDeleted += result.deletedCount
    collectionsProcessed++

    if (result.deletedCount > 0) {
      await logGdprAudit(db, {
        action: 'retention_cleanup',
        userId: 'system',
        metadata: {
          collection: collName,
          cutoffDate,
          deletedCount: result.deletedCount,
        },
      })
    }
  }

  return { collectionsProcessed, documentsDeleted: totalDeleted }
}
