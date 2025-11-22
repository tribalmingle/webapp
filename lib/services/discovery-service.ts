import { ObjectId } from 'mongodb'

import type { DiscoveryRecipeDocument } from '@/lib/data/types'
import { getMongoDb } from '@/lib/mongodb'
import { withSpan } from '@/lib/observability/tracing'
import { MatchingService, type RankedCandidate } from './matching-service'
import { AnalyticsService } from './analytics-service'

export type DiscoveryMode = 'swipe' | 'story'

export interface DiscoveryFilters {
  verifiedOnly?: boolean
  faithPractice?: string
  lifeGoals?: string[]
  travelMode?: 'home' | 'passport'
  onlineNow?: boolean
  guardianApproved?: boolean
}

export interface DiscoveryFeedResponse {
  mode: DiscoveryMode
  filters: DiscoveryFilters
  candidates: RankedCandidate[]
  storyPanels: Array<RankedCandidate & { contextPanel: string }>
  recipes: Array<{ id: string; name: string; filters: DiscoveryFilters; isDefault: boolean }>
  telemetry: { generatedAt: string; total: number }
}

const DEFAULT_FILTERS: DiscoveryFilters = {
  verifiedOnly: true,
  travelMode: 'home',
  lifeGoals: [],
  guardianApproved: false,
}

export class DiscoveryService {
  static async getFeed(userId: string, params?: { mode?: DiscoveryMode; filters?: DiscoveryFilters; recipeId?: string }) {
    return withSpan('discovery.feed', async () => {
      const mode = params?.mode ?? 'swipe'
      const db = await getMongoDb()
      const recipes = await this.listRecipes(userId)

      let recipeFilters = DEFAULT_FILTERS
      if (params?.recipeId) {
        const selected = recipes.find((recipe) => recipe.id === params.recipeId)
        if (selected) {
          recipeFilters = { ...recipeFilters, ...selected.filters }
          await this.markRecipeUsage(selected.id)
        }
      } else {
        const defaultRecipe = recipes.find((recipe) => recipe.isDefault)
        if (defaultRecipe) {
          recipeFilters = { ...recipeFilters, ...defaultRecipe.filters }
        }
      }

      const mergedFilters = this.mergeFilters(recipeFilters, params?.filters)
      const rankedCandidates = await MatchingService.getRankedCandidates(userId)
      const filteredCandidates = this.applyFilters(rankedCandidates, mergedFilters)
      const decorated = filteredCandidates.map((candidate, index) => this.decorateCandidate(candidate, index))

      const storyPanels = decorated.slice(0, 9).map((candidate) => ({
        ...candidate,
        contextPanel: this.buildContextPanel(candidate),
      }))

      const response: DiscoveryFeedResponse = {
        mode,
        filters: mergedFilters,
        candidates: mode === 'swipe' ? decorated : decorated.slice(0, 24),
        storyPanels,
        recipes,
        telemetry: { generatedAt: new Date().toISOString(), total: decorated.length },
      }

      await AnalyticsService.track({
        eventType: `discover.feed.loaded`,
        userId,
        properties: { mode, total: decorated.length, recipeId: params?.recipeId },
      })

      return response
    }, { userId })
  }

  static async saveRecipe(userId: string, payload: { name: string; filters: DiscoveryFilters; isDefault?: boolean }) {
    return withSpan('discovery.saveRecipe', async () => {
      const db = await getMongoDb()
      const collection = db.collection<DiscoveryRecipeDocument>('discovery_recipes')
      const userObjectId = new ObjectId(userId)
      const now = new Date()

      if (payload.isDefault) {
        await collection.updateMany({ userId: userObjectId }, { $set: { isDefault: false } })
      }

      const doc: DiscoveryRecipeDocument = {
        userId: userObjectId,
        name: payload.name,
        filters: { ...DEFAULT_FILTERS, ...payload.filters },
        isDefault: payload.isDefault ?? false,
        lastUsedAt: now,
        createdAt: now,
        updatedAt: now,
      }

      const result = await collection.findOneAndUpdate(
        { userId: userObjectId, name: payload.name },
        { $set: doc },
        { upsert: true, returnDocument: 'after' },
      )

      await AnalyticsService.track({
        eventType: 'discover.filter.saved',
        userId,
        properties: { name: payload.name, isDefault: payload.isDefault ?? false },
      })

      return result.value
    }, { userId, recipeName: payload.name })
  }

  static async listRecipes(userId: string) {
    const db = await getMongoDb()
    const collection = db.collection<DiscoveryRecipeDocument>('discovery_recipes')
    const cursor = collection.find({ userId: new ObjectId(userId) }).sort({ updatedAt: -1 }).limit(20)
    const docs = await cursor.toArray()
    return docs.map((doc) => ({
      id: doc._id?.toHexString() ?? `${doc.userId.toHexString()}-${doc.name}`,
      name: doc.name,
      filters: doc.filters,
      isDefault: doc.isDefault,
    }))
  }

  private static mergeFilters(base: DiscoveryFilters, overrides?: DiscoveryFilters) {
    if (!overrides) return base
    return {
      ...base,
      ...overrides,
    }
  }

  private static applyFilters(candidates: RankedCandidate[], filters: DiscoveryFilters) {
    return candidates.filter((candidate) => {
      if (filters.verifiedOnly && !candidate.profile.verificationStatus?.badgeIssuedAt) {
        return false
      }
      if (filters.guardianApproved && !candidate.profile.verificationStatus?.background) {
        return false
      }
      if (filters.faithPractice && candidate.profile.faithPractice !== filters.faithPractice) {
        return false
      }
      if (filters.lifeGoals && filters.lifeGoals.length) {
        const desired = new Set(filters.lifeGoals)
        if (!candidate.profile.marriageTimeline || !desired.has(candidate.profile.marriageTimeline)) {
          return false
        }
      }
      if (filters.travelMode === 'home' && candidate.profile.visibility?.incognito) {
        return false
      }
      if (filters.onlineNow) {
        const hash = candidate.candidateId.charCodeAt(0) % 2 === 0
        if (!hash) return false
      }
      return true
    })
  }

  private static decorateCandidate(candidate: RankedCandidate, index: number): RankedCandidate {
    const liveScore = Math.min(1, candidate.matchScore + index * 0.002)
    return {
      ...candidate,
      matchScore: Number(liveScore.toFixed(3)),
      conciergePrompt: `${candidate.conciergePrompt} We estimate a ${Math.round(liveScore * 100)}% harmony.`,
      aiOpener: candidate.aiOpener,
    }
  }

  private static buildContextPanel(candidate: RankedCandidate) {
    const values = candidate.profile.culturalValues
    const strongest = Object.entries(values).sort((a, b) => b[1] - a[1])[0]?.[0]
    const geo = candidate.profile.location?.city ? `${candidate.profile.location.city}, ${candidate.profile.location.country}` : 'your circles'
    return `${candidate.profile.name} leans into ${strongest ?? 'shared rituals'} and is currently engaging guardians in ${geo}.`
  }

  private static async markRecipeUsage(recipeId: string) {
    const db = await getMongoDb()
    await db
      .collection<DiscoveryRecipeDocument>('discovery_recipes')
      .updateOne({ _id: new ObjectId(recipeId) }, { $set: { lastUsedAt: new Date() } })
  }
}
