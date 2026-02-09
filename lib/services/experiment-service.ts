/**
 * A/B Testing Engine Service
 * Handles experiment lifecycle, user bucketing, exposure tracking, and statistical analysis
 */

import crypto from 'crypto'
import { ObjectId, type Filter } from 'mongodb'
import { getMongoDb } from '@/lib/mongodb'
import {
  ADMIN_COLLECTIONS,
  type ExperimentDocument,
  type ExperimentAssignmentDocument,
} from '@/lib/data/admin-collections'

// ============================================================================
// Types
// ============================================================================

export interface CreateExperimentInput {
  experimentKey: string
  name: string
  description?: string
  owner: string
  targetAudience: ExperimentDocument['targetAudience']
  variants: ExperimentDocument['variants']
  primaryMetric: ExperimentDocument['primaryMetric']
  secondaryMetrics?: ExperimentDocument['secondaryMetrics']
  guardrails?: ExperimentDocument['guardrails']
  minSampleSize?: number
  minDurationDays?: number
}

export interface ExperimentResults {
  sampleSizes: Record<string, number>
  metrics: Record<string, VariantMetric>
  isSignificant: boolean
  confidence: number
  recommendedAction: 'continue' | 'ship_treatment' | 'ship_control' | 'end_inconclusive'
  guardrailViolations: string[]
}

export interface VariantMetric {
  control: number
  treatment: number
  lift: number
  pValue: number
  ci95: [number, number]
  isSignificant: boolean
}

export interface UserExperimentAssignment {
  experimentKey: string
  variantKey: string
  config: Record<string, any>
}

// ============================================================================
// Experiment Lifecycle
// ============================================================================

/**
 * Create a new experiment in draft status
 */
export async function createExperiment(
  input: CreateExperimentInput,
  createdBy: string
): Promise<ExperimentDocument> {
  const db = await getMongoDb()
  const collection = db.collection<ExperimentDocument>(ADMIN_COLLECTIONS.EXPERIMENTS)

  // Validate experiment key uniqueness
  const existing = await collection.findOne({ experimentKey: input.experimentKey })
  if (existing) {
    throw new Error(`Experiment with key "${input.experimentKey}" already exists`)
  }

  // Validate variant weights sum to 100
  const totalWeight = input.variants.reduce((sum, v) => sum + v.weight, 0)
  if (totalWeight !== 100) {
    throw new Error(`Variant weights must sum to 100, got ${totalWeight}`)
  }

  // Validate at least one control variant
  const hasControl = input.variants.some((v) => v.variantKey === 'control')
  if (!hasControl) {
    throw new Error('Experiment must have a "control" variant')
  }

  const now = new Date()
  const experiment: ExperimentDocument = {
    experimentKey: input.experimentKey,
    name: input.name,
    description: input.description || '',
    createdBy: new ObjectId(createdBy),
    owner: input.owner,
    targetAudience: input.targetAudience,
    variants: input.variants,
    primaryMetric: input.primaryMetric,
    secondaryMetrics: input.secondaryMetrics || [],
    guardrails: input.guardrails || [],
    status: 'draft',
    minSampleSize: input.minSampleSize || 1000,
    minDurationDays: input.minDurationDays || 7,
    createdAt: now,
    updatedAt: now,
  }

  const result = await collection.insertOne(experiment as any)
  experiment._id = result.insertedId

  return experiment
}

/**
 * Start an experiment - begins user assignment
 */
export async function startExperiment(experimentKey: string): Promise<ExperimentDocument> {
  const db = await getMongoDb()
  const collection = db.collection<ExperimentDocument>(ADMIN_COLLECTIONS.EXPERIMENTS)

  const result = await collection.findOneAndUpdate(
    { experimentKey, status: 'draft' },
    {
      $set: {
        status: 'running',
        startedAt: new Date(),
        updatedAt: new Date(),
      },
    },
    { returnDocument: 'after' }
  )

  if (!result) {
    throw new Error(`Cannot start experiment "${experimentKey}" - not found or not in draft status`)
  }

  return result
}

/**
 * Pause a running experiment
 */
export async function pauseExperiment(experimentKey: string): Promise<ExperimentDocument> {
  const db = await getMongoDb()
  const collection = db.collection<ExperimentDocument>(ADMIN_COLLECTIONS.EXPERIMENTS)

  const result = await collection.findOneAndUpdate(
    { experimentKey, status: 'running' },
    {
      $set: {
        status: 'paused',
        pausedAt: new Date(),
        updatedAt: new Date(),
      },
    },
    { returnDocument: 'after' }
  )

  if (!result) {
    throw new Error(`Cannot pause experiment "${experimentKey}" - not found or not running`)
  }

  return result
}

/**
 * Resume a paused experiment
 */
export async function resumeExperiment(experimentKey: string): Promise<ExperimentDocument> {
  const db = await getMongoDb()
  const collection = db.collection<ExperimentDocument>(ADMIN_COLLECTIONS.EXPERIMENTS)

  const result = await collection.findOneAndUpdate(
    { experimentKey, status: 'paused' },
    {
      $set: {
        status: 'running',
        updatedAt: new Date(),
      },
      $unset: { pausedAt: '' },
    },
    { returnDocument: 'after' }
  )

  if (!result) {
    throw new Error(`Cannot resume experiment "${experimentKey}" - not found or not paused`)
  }

  return result
}

/**
 * Complete an experiment - stop new assignments
 */
export async function completeExperiment(experimentKey: string): Promise<ExperimentDocument> {
  const db = await getMongoDb()
  const collection = db.collection<ExperimentDocument>(ADMIN_COLLECTIONS.EXPERIMENTS)

  // Calculate final results before completing
  const results = await evaluateExperiment(experimentKey)

  const result = await collection.findOneAndUpdate(
    { experimentKey, status: { $in: ['running', 'paused'] } },
    {
      $set: {
        status: 'completed',
        endedAt: new Date(),
        results: {
          ...results,
          calculatedAt: new Date(),
        },
        updatedAt: new Date(),
      },
    },
    { returnDocument: 'after' }
  )

  if (!result) {
    throw new Error(`Cannot complete experiment "${experimentKey}" - not found or invalid status`)
  }

  return result
}

/**
 * Rollback an experiment - revert to control
 */
export async function rollbackExperiment(
  experimentKey: string,
  reason: string
): Promise<ExperimentDocument> {
  const db = await getMongoDb()
  const collection = db.collection<ExperimentDocument>(ADMIN_COLLECTIONS.EXPERIMENTS)

  const result = await collection.findOneAndUpdate(
    { experimentKey, status: { $in: ['running', 'paused', 'completed'] } },
    {
      $set: {
        status: 'rolled_back',
        endedAt: new Date(),
        updatedAt: new Date(),
      },
      $unset: { rolloutConfig: '' },
      $push: {
        notes: `Rolled back: ${reason}`,
      } as any,
    },
    { returnDocument: 'after' }
  )

  if (!result) {
    throw new Error(`Cannot rollback experiment "${experimentKey}"`)
  }

  return result
}

/**
 * Rollout winning variant to all users
 */
export async function rolloutExperiment(
  experimentKey: string,
  winnerVariant: string,
  rolloutPercentage: number
): Promise<ExperimentDocument> {
  const db = await getMongoDb()
  const collection = db.collection<ExperimentDocument>(ADMIN_COLLECTIONS.EXPERIMENTS)

  const experiment = await collection.findOne({ experimentKey })
  if (!experiment) {
    throw new Error(`Experiment "${experimentKey}" not found`)
  }

  // Validate winner variant exists
  const variantExists = experiment.variants.some((v) => v.variantKey === winnerVariant)
  if (!variantExists) {
    throw new Error(`Variant "${winnerVariant}" not found in experiment`)
  }

  const result = await collection.findOneAndUpdate(
    { experimentKey },
    {
      $set: {
        rolloutConfig: {
          winnerVariant,
          rolloutPercentage,
          rolloutStartedAt: new Date(),
        },
        updatedAt: new Date(),
      },
    },
    { returnDocument: 'after' }
  )

  return result!
}

// ============================================================================
// User Bucketing
// ============================================================================

/**
 * Deterministic, consistent user bucketing algorithm
 * Uses SHA256 hash of userId + experimentKey for reproducible assignment
 */
export function assignUserToVariant(
  userId: string,
  experimentKey: string,
  variants: Array<{ variantKey: string; weight: number }>
): string {
  // Create deterministic hash
  const hash = crypto
    .createHash('sha256')
    .update(`${userId}:${experimentKey}`)
    .digest('hex')

  // Convert first 8 hex chars to number between 0-100
  const bucket = (parseInt(hash.substring(0, 8), 16) % 10000) / 100

  // Assign to variant based on cumulative weights
  let cumulative = 0
  for (const variant of variants) {
    cumulative += variant.weight
    if (bucket < cumulative) {
      return variant.variantKey
    }
  }

  // Fallback to first variant (shouldn't happen if weights sum to 100)
  return variants[0]?.variantKey || 'control'
}

/**
 * Check if user is eligible for experiment based on targeting rules
 */
export async function isUserEligibleForExperiment(
  userId: string,
  experiment: ExperimentDocument
): Promise<boolean> {
  const db = await getMongoDb()

  // Check percentage allocation
  const hash = crypto
    .createHash('sha256')
    .update(`eligibility:${userId}:${experiment.experimentKey}`)
    .digest('hex')
  const eligibilityBucket = (parseInt(hash.substring(0, 8), 16) % 10000) / 100

  if (eligibilityBucket >= experiment.targetAudience.percentOfUsers) {
    return false
  }

  // Check filter criteria
  const filters = experiment.targetAudience.filters
  if (Object.keys(filters).length === 0) {
    return true
  }

  // Build user query
  const userFilter: Filter<any> = { _id: new ObjectId(userId) }

  // Lookup user and profile to check eligibility
  const [user] = await db
    .collection('users')
    .aggregate([
      { $match: userFilter },
      {
        $lookup: {
          from: 'profiles',
          localField: '_id',
          foreignField: 'userId',
          as: 'profile',
        },
      },
      { $unwind: { path: '$profile', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'subscriptions',
          localField: '_id',
          foreignField: 'userId',
          as: 'subscription',
        },
      },
      { $unwind: { path: '$subscription', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'user_flags',
          localField: '_id',
          foreignField: 'userId',
          as: 'flags',
        },
      },
      { $unwind: { path: '$flags', preserveNullAndEmptyArrays: true } },
    ])
    .toArray()

  if (!user) {
    return false
  }

  // Check plan filter
  if (filters.planIds && filters.planIds.length > 0) {
    const userPlan = user.subscription?.planId || 'free'
    if (!filters.planIds.includes(userPlan)) {
      return false
    }
  }

  // Check tribe filter
  if (filters.tribes && filters.tribes.length > 0) {
    const userTribe = user.profile?.tribe
    if (!userTribe || !filters.tribes.includes(userTribe)) {
      return false
    }
  }

  // Check country filter
  if (filters.countries && filters.countries.length > 0) {
    const userCountry = user.profile?.location?.country
    if (!userCountry || !filters.countries.includes(userCountry)) {
      return false
    }
  }

  // Check registration date filter
  if (filters.registeredAfter) {
    const registeredAt = user.createdAt
    if (registeredAt < filters.registeredAfter) {
      return false
    }
  }

  // Check trust score filter
  if (filters.minTrustScore !== undefined) {
    const trustScore = user.flags?.flags?.trustScore ?? 50
    if (trustScore < filters.minTrustScore) {
      return false
    }
  }

  return true
}

/**
 * Get user's experiment assignment, creating one if needed for running experiments
 */
export async function getUserExperimentAssignment(
  userId: string,
  experimentKey: string
): Promise<UserExperimentAssignment | null> {
  const db = await getMongoDb()

  // Check if user already has an assignment
  const existingAssignment = await db
    .collection<ExperimentAssignmentDocument>(ADMIN_COLLECTIONS.EXPERIMENT_ASSIGNMENTS)
    .findOne({ userId: new ObjectId(userId), experimentKey })

  if (existingAssignment) {
    // Get variant config from experiment
    const experiment = await db
      .collection<ExperimentDocument>(ADMIN_COLLECTIONS.EXPERIMENTS)
      .findOne({ experimentKey })

    const variant = experiment?.variants.find((v) => v.variantKey === existingAssignment.variantKey)

    return {
      experimentKey,
      variantKey: existingAssignment.variantKey,
      config: variant?.config || {},
    }
  }

  // Get experiment
  const experiment = await db
    .collection<ExperimentDocument>(ADMIN_COLLECTIONS.EXPERIMENTS)
    .findOne({ experimentKey })

  if (!experiment) {
    return null
  }

  // Only assign to running experiments
  if (experiment.status !== 'running') {
    // If experiment is completed and has rollout, return winner
    if (experiment.status === 'completed' && experiment.rolloutConfig) {
      const variant = experiment.variants.find(
        (v) => v.variantKey === experiment.rolloutConfig!.winnerVariant
      )
      return {
        experimentKey,
        variantKey: experiment.rolloutConfig.winnerVariant,
        config: variant?.config || {},
      }
    }
    return null
  }

  // Check eligibility
  const isEligible = await isUserEligibleForExperiment(userId, experiment)
  if (!isEligible) {
    return null
  }

  // Assign to variant
  const variantKey = assignUserToVariant(userId, experimentKey, experiment.variants)
  const variant = experiment.variants.find((v) => v.variantKey === variantKey)

  // Store assignment
  const now = new Date()
  const assignment: ExperimentAssignmentDocument = {
    userId: new ObjectId(userId),
    experimentKey,
    variantKey,
    assignedAt: now,
    assignmentSource: 'server',
    exposureCount: 0,
    converted: false,
    createdAt: now,
    updatedAt: now,
  }

  await db
    .collection(ADMIN_COLLECTIONS.EXPERIMENT_ASSIGNMENTS)
    .insertOne(assignment as any)

  return {
    experimentKey,
    variantKey,
    config: variant?.config || {},
  }
}

/**
 * Get all active experiment assignments for a user
 */
export async function getAllUserExperiments(userId: string): Promise<UserExperimentAssignment[]> {
  const db = await getMongoDb()

  // Get all running experiments
  const experiments = await db
    .collection<ExperimentDocument>(ADMIN_COLLECTIONS.EXPERIMENTS)
    .find({ status: 'running' })
    .toArray()

  const assignments: UserExperimentAssignment[] = []

  for (const experiment of experiments) {
    const assignment = await getUserExperimentAssignment(userId, experiment.experimentKey)
    if (assignment) {
      assignments.push(assignment)
    }
  }

  return assignments
}

// ============================================================================
// Exposure Tracking
// ============================================================================

/**
 * Track that a user was exposed to an experiment variant
 */
export async function trackExposure(
  userId: string,
  experimentKey: string,
  variantKey: string
): Promise<void> {
  const db = await getMongoDb()
  const now = new Date()

  await db.collection(ADMIN_COLLECTIONS.EXPERIMENT_ASSIGNMENTS).updateOne(
    { userId: new ObjectId(userId), experimentKey },
    {
      $setOnInsert: {
        variantKey,
        assignedAt: now,
        assignmentSource: 'client',
        converted: false,
        createdAt: now,
      },
      $set: {
        firstExposedAt: { $ifNull: ['$firstExposedAt', now] },
        updatedAt: now,
      },
      $inc: { exposureCount: 1 },
    },
    { upsert: true }
  )
}

/**
 * Track that a user converted (completed the primary metric event)
 */
export async function trackConversion(
  userId: string,
  experimentKey: string,
  conversionValue?: number
): Promise<void> {
  const db = await getMongoDb()
  const now = new Date()

  await db.collection(ADMIN_COLLECTIONS.EXPERIMENT_ASSIGNMENTS).updateOne(
    { userId: new ObjectId(userId), experimentKey, converted: false },
    {
      $set: {
        converted: true,
        convertedAt: now,
        conversionValue,
        updatedAt: now,
      },
    }
  )
}

// ============================================================================
// Statistical Analysis
// ============================================================================

/**
 * Calculate statistical significance using two-proportion z-test
 */
function calculateZTest(
  controlConversions: number,
  controlTotal: number,
  treatmentConversions: number,
  treatmentTotal: number
): { zScore: number; pValue: number } {
  const controlRate = controlConversions / controlTotal
  const treatmentRate = treatmentConversions / treatmentTotal

  // Pooled proportion
  const pooledRate =
    (controlConversions + treatmentConversions) / (controlTotal + treatmentTotal)

  // Standard error
  const se = Math.sqrt(
    pooledRate * (1 - pooledRate) * (1 / controlTotal + 1 / treatmentTotal)
  )

  // Z-score
  const zScore = (treatmentRate - controlRate) / se

  // Two-tailed p-value using normal approximation
  const pValue = 2 * (1 - normalCDF(Math.abs(zScore)))

  return { zScore, pValue }
}

/**
 * Standard normal cumulative distribution function
 */
function normalCDF(x: number): number {
  const a1 = 0.254829592
  const a2 = -0.284496736
  const a3 = 1.421413741
  const a4 = -1.453152027
  const a5 = 1.061405429
  const p = 0.3275911

  const sign = x < 0 ? -1 : 1
  x = Math.abs(x) / Math.sqrt(2)

  const t = 1.0 / (1.0 + p * x)
  const y = 1.0 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x)

  return 0.5 * (1.0 + sign * y)
}

/**
 * Evaluate experiment and calculate results
 */
export async function evaluateExperiment(experimentKey: string): Promise<ExperimentResults> {
  const db = await getMongoDb()

  // Get experiment
  const experiment = await db
    .collection<ExperimentDocument>(ADMIN_COLLECTIONS.EXPERIMENTS)
    .findOne({ experimentKey })

  if (!experiment) {
    throw new Error(`Experiment "${experimentKey}" not found`)
  }

  // Get assignments by variant
  const assignmentPipeline = [
    { $match: { experimentKey } },
    {
      $group: {
        _id: '$variantKey',
        total: { $sum: 1 },
        converted: { $sum: { $cond: ['$converted', 1, 0] } },
        totalConversionValue: { $sum: { $ifNull: ['$conversionValue', 0] } },
      },
    },
  ]

  const variantStats = await db
    .collection(ADMIN_COLLECTIONS.EXPERIMENT_ASSIGNMENTS)
    .aggregate(assignmentPipeline)
    .toArray()

  // Build sample sizes
  const sampleSizes: Record<string, number> = {}
  for (const stat of variantStats) {
    sampleSizes[stat._id] = stat.total
  }

  // Find control and treatment stats
  const controlStats = variantStats.find((v) => v._id === 'control')
  const treatmentStats = variantStats.find((v) => v._id !== 'control')

  if (!controlStats || !treatmentStats) {
    return {
      sampleSizes,
      metrics: {},
      isSignificant: false,
      confidence: 0,
      recommendedAction: 'continue',
      guardrailViolations: [],
    }
  }

  // Calculate primary metric
  const controlRate = controlStats.converted / controlStats.total
  const treatmentRate = treatmentStats.converted / treatmentStats.total
  const lift = controlRate > 0 ? (treatmentRate - controlRate) / controlRate : 0

  const { zScore, pValue } = calculateZTest(
    controlStats.converted,
    controlStats.total,
    treatmentStats.converted,
    treatmentStats.total
  )

  // 95% confidence interval
  const se = Math.sqrt(
    (controlRate * (1 - controlRate)) / controlStats.total +
      (treatmentRate * (1 - treatmentRate)) / treatmentStats.total
  )
  const ci95: [number, number] = [
    lift - (1.96 * se) / (controlRate || 1),
    lift + (1.96 * se) / (controlRate || 1),
  ]

  const isSignificant = pValue < 0.05
  const confidence = 1 - pValue

  // Check guardrails
  const guardrailViolations: string[] = []
  for (const guardrail of experiment.guardrails) {
    // This would need to be expanded to check actual guardrail metrics
    // For now, we'll just note that guardrail checking would happen here
  }

  // Determine recommended action
  let recommendedAction: ExperimentResults['recommendedAction']
  const totalSample = controlStats.total + treatmentStats.total
  const daysSinceStart = experiment.startedAt
    ? (Date.now() - experiment.startedAt.getTime()) / (1000 * 60 * 60 * 24)
    : 0

  if (guardrailViolations.length > 0) {
    recommendedAction = 'ship_control'
  } else if (
    !isSignificant &&
    (totalSample < experiment.minSampleSize || daysSinceStart < experiment.minDurationDays)
  ) {
    recommendedAction = 'continue'
  } else if (isSignificant && lift > 0) {
    recommendedAction = 'ship_treatment'
  } else if (isSignificant && lift < 0) {
    recommendedAction = 'ship_control'
  } else {
    recommendedAction = 'end_inconclusive'
  }

  return {
    sampleSizes,
    metrics: {
      primary: {
        control: controlRate,
        treatment: treatmentRate,
        lift,
        pValue,
        ci95,
        isSignificant,
      },
    },
    isSignificant,
    confidence,
    recommendedAction,
    guardrailViolations,
  }
}

// ============================================================================
// Query Functions
// ============================================================================

/**
 * List experiments with filtering
 */
export async function listExperiments(options: {
  status?: ExperimentDocument['status'] | ExperimentDocument['status'][]
  owner?: string
  page?: number
  limit?: number
}): Promise<{ experiments: ExperimentDocument[]; total: number }> {
  const db = await getMongoDb()
  const collection = db.collection<ExperimentDocument>(ADMIN_COLLECTIONS.EXPERIMENTS)

  const filter: Filter<ExperimentDocument> = {}

  if (options.status) {
    filter.status = Array.isArray(options.status)
      ? { $in: options.status }
      : options.status
  }

  if (options.owner) {
    filter.owner = options.owner
  }

  const page = options.page || 1
  const limit = options.limit || 20

  const [experiments, total] = await Promise.all([
    collection
      .find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray(),
    collection.countDocuments(filter),
  ])

  return { experiments, total }
}

/**
 * Get experiment by key
 */
export async function getExperiment(experimentKey: string): Promise<ExperimentDocument | null> {
  const db = await getMongoDb()
  return db
    .collection<ExperimentDocument>(ADMIN_COLLECTIONS.EXPERIMENTS)
    .findOne({ experimentKey })
}
