import { ObjectId } from 'mongodb'
import { getCollection } from '@/lib/db/mongodb'
import { COLLECTIONS } from '@/lib/db/collections'
import { redisCacheGet, redisCacheSet } from '@/lib/redis/client'

export type FeatureFlag = {
  _id?: ObjectId
  key: string
  name: string
  description?: string
  enabled: boolean
  rolloutPercentage: number
  targetSegments?: string[]
  variants?: Array<{
    key: string
    name: string
    weight: number
  }>
  createdAt: Date
  updatedAt: Date
  createdBy: string
}

export type ExperimentResult = {
  flagKey: string
  variant: string
  metrics: {
    users: number
    conversions: number
    conversionRate: number
    revenue?: number
  }
}

export class FeatureFlagService {
  /**
   * Create a new feature flag
   */
  static async createFlag(flag: Omit<FeatureFlag, '_id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const flags = await getCollection(COLLECTIONS.FEATURE_FLAGS)
    
    const doc = {
      ...flag,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await flags.insertOne(doc)
    return result.insertedId.toString()
  }

  /**
   * List all feature flags
   */
  static async listFlags(): Promise<FeatureFlag[]> {
    const flags = await getCollection<FeatureFlag>(COLLECTIONS.FEATURE_FLAGS)
    return await flags.find().sort({ createdAt: -1 }).toArray()
  }

  /**
   * Get flag by key
   */
  static async getFlag(key: string): Promise<FeatureFlag | null> {
    const cacheKey = `feature_flag:${key}`
    const cached = await redisCacheGet<FeatureFlag>(cacheKey)
    if (cached) return cached
    const flags = await getCollection<FeatureFlag>(COLLECTIONS.FEATURE_FLAGS)
    const flag = await flags.findOne({ key })
    if (flag) await redisCacheSet(cacheKey, flag, 30) // 30s TTL
    return flag
  }

  /**
   * Update feature flag
   */
  static async updateFlag(key: string, updates: Partial<FeatureFlag>): Promise<void> {
    const flags = await getCollection(COLLECTIONS.FEATURE_FLAGS)
    await flags.updateOne(
      { key },
      { 
        $set: { 
          ...updates,
          updatedAt: new Date(),
        },
      }
    )
    // Invalidate cache
    await redisCacheSet(`feature_flag:${key}`, await flags.findOne({ key }), 30)
  }

  /**
   * Toggle feature flag
   */
  static async toggleFlag(key: string): Promise<void> {
    const flags = await getCollection<FeatureFlag>(COLLECTIONS.FEATURE_FLAGS)
    const flag = await flags.findOne({ key })

    if (!flag) {
      throw new Error('Flag not found')
    }

    await flags.updateOne(
      { key },
      { 
        $set: { 
          enabled: !flag.enabled,
          updatedAt: new Date(),
        },
      }
    )
    await redisCacheSet(`feature_flag:${key}`, await flags.findOne({ key }), 30)
  }

  /**
   * Evaluate if flag is enabled for user
   */
  static async isEnabled(key: string, userId: string): Promise<boolean> {
    const flag = await this.getFlag(key)

    if (!flag || !flag.enabled) {
      return false
    }

    // If 100% rollout, return true
    if (flag.rolloutPercentage === 100) {
      return true
    }

    // Simple hash-based rollout
    const hash = this.hashUserId(userId)
    const bucket = hash % 100
    return bucket < flag.rolloutPercentage
  }

  /**
   * Get variant for user (for A/B testing)
   */
  static async getVariant(key: string, userId: string): Promise<string | null> {
    const flag = await this.getFlag(key)

    if (!flag || !flag.enabled || !flag.variants || flag.variants.length === 0) {
      return null
    }

    const hash = this.hashUserId(userId)
    const bucket = hash % 100

    let cumulative = 0
    for (const variant of flag.variants) {
      cumulative += variant.weight
      if (bucket < cumulative) {
        return variant.key
      }
    }

    return flag.variants[0].key
  }

  /**
   * Get experiment results
   */
  static async getExperimentResults(flagKey: string): Promise<ExperimentResult[]> {
    const analytics = await getCollection(COLLECTIONS.ANALYTICS_EVENTS)
    const flag = await this.getFlag(flagKey)

    if (!flag || !flag.variants) {
      return []
    }

    const results: ExperimentResult[] = []

    for (const variant of flag.variants) {
      // Count users who saw this variant
      const users = await analytics.distinct('userId', {
        eventType: 'feature_flag.evaluated',
        'properties.flagKey': flagKey,
        'properties.variant': variant.key,
      })

      // Count conversions
      const conversions = await analytics.countDocuments({
        userId: { $in: users },
        eventType: 'subscription.upgraded',
      })

      results.push({
        flagKey,
        variant: variant.key,
        metrics: {
          users: users.length,
          conversions,
          conversionRate: users.length > 0 ? (conversions / users.length) * 100 : 0,
        },
      })
    }

    return results
  }

  /**
   * Calculate statistical significance (basic chi-square test)
   */
  static calculateSignificance(control: ExperimentResult, treatment: ExperimentResult): number {
    const n1 = control.metrics.users
    const n2 = treatment.metrics.users
    const x1 = control.metrics.conversions
    const x2 = treatment.metrics.conversions

    if (n1 === 0 || n2 === 0) return 0

    const p1 = x1 / n1
    const p2 = x2 / n2
    const pPool = (x1 + x2) / (n1 + n2)

    const se = Math.sqrt(pPool * (1 - pPool) * (1/n1 + 1/n2))
    const z = (p2 - p1) / se

    // Return p-value (simplified)
    return 1 - this.normalCDF(Math.abs(z))
  }

  /**
   * Simple hash function for user ID
   */
  private static hashUserId(userId: string): number {
    let hash = 0
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash
    }
    return Math.abs(hash)
  }

  /**
   * Normal CDF approximation
   */
  private static normalCDF(x: number): number {
    const t = 1 / (1 + 0.2316419 * Math.abs(x))
    const d = 0.3989423 * Math.exp(-x * x / 2)
    const prob = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))))
    return x > 0 ? 1 - prob : prob
  }
}
