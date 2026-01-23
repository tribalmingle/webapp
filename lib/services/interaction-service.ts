import { ObjectId } from 'mongodb'

import type { BoostSessionDocument, InteractionEventDocument, LikeDocument, MatchDocument, RewindDocument, SuperLikeDocument } from '@/lib/data/types'
import { getMongoDb } from '@/lib/mongodb'
import { withSpan } from '@/lib/observability/tracing'
import { MatchingService } from './matching-service'
import { AnalyticsService } from './analytics-service'
import { computeMatchScore } from '@/lib/matching/match-score'

type InteractionKind = 'like' | 'super_like' | 'rewind'

type InteractionContextInput = {
  source?: string
  device?: string
  location?: string
  recipeId?: string
}

type PersistedInteractionContext = {
  source: string
  device?: string
  location?: string
  recipeId?: string
}

const DAILY_LIMITS: Record<InteractionKind, number> = {
  like: 100,
  super_like: 5,
  rewind: 3,
}

export class InteractionService {
  static async like(actorId: string, targetId: string, context?: InteractionContextInput) {
    return this.recordInteraction('like', actorId, targetId, context)
  }

  static async superLike(actorId: string, targetId: string, context?: InteractionContextInput & { boostScore?: number }) {
    return this.recordInteraction('super_like', actorId, targetId, context)
  }

  static async rewind(actorId: string, targetId: string) {
    return withSpan('interaction.rewind', async () => {
      const actor = new ObjectId(actorId)
      const target = new ObjectId(targetId)
      await this.assertQuota(actor, 'rewind')
      const db = await getMongoDb()
      const collection = db.collection<RewindDocument>('rewinds')
      const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24)
      await collection.updateOne(
        { userId: actor, targetId: target },
        { $set: { userId: actor, targetId: target, reason: 'accidental', expiresAt, updatedAt: new Date(), createdAt: new Date() } },
        { upsert: true },
      )
      await this.recordEvent(actor, target, 'rewind', { expiresAt: expiresAt.toISOString() })
      await AnalyticsService.track({ eventType: 'discover.rewind', userId: actorId, properties: { targetId } })
      return { success: true }
    }, { actorId, targetId })
  }

  static async getMatches(userId: string) {
    const db = await getMongoDb()
    const collection = db.collection<MatchDocument>('matches')
    const docs = await collection
      .find({ memberIds: new ObjectId(userId) })
      .sort({ updatedAt: -1 })
      .limit(50)
      .toArray()

    const usersCollection = db.collection('users')
    const currentUser = await usersCollection.findOne({ _id: new ObjectId(userId) })

    const otherIds = docs
      .map((doc) => doc.memberIds.find((id) => id.toHexString() !== userId))
      .filter(Boolean) as ObjectId[]

    const otherUsers = otherIds.length
      ? await usersCollection
          .find({ _id: { $in: otherIds } })
          .project({ password: 0 })
          .toArray()
      : []

    const otherUserMap = new Map<string, any>()
    otherUsers.forEach((user) => {
      otherUserMap.set((user as any)._id?.toHexString?.() ?? String((user as any)._id), user)
    })

    const enriched = docs.map((doc) => {
      const otherId = doc.memberIds.find((id) => id.toHexString() !== userId)
      const otherUser = otherId ? otherUserMap.get(otherId.toHexString()) : undefined
      const match = computeMatchScore(currentUser, otherUser)
      const profilePhoto = Array.isArray(otherUser?.profilePhotos) && otherUser.profilePhotos.length > 0
        ? otherUser.profilePhotos[0]
        : otherUser?.profilePhoto

      return {
        matchId: doc._id?.toHexString() ?? doc.pairHash,
        score: doc.score,
        matchPercent: match.matchPercent,
        matchReasons: match.reasons,
        matchBreakdown: match.breakdown,
        priorityScore: match.priority,
        aiOpener: doc.aiOpener,
        trustBadges: doc.trustBadges,
        state: doc.state,
        insights: doc.insights,
        members: doc.memberIds.map((id) => id.toHexString()),
        confirmedAt: doc.confirmedAt?.toISOString(),
        updatedAt: doc.updatedAt,
        id: otherUser?._id?.toString?.() ?? otherUser?._id,
        userId: otherUser?._id?.toString?.() ?? otherUser?._id,
        email: otherUser?.email,
        name: otherUser?.name,
        age: otherUser?.age,
        gender: otherUser?.gender,
        tribe: otherUser?.tribe,
        city: otherUser?.city,
        country: otherUser?.country,
        heritage: otherUser?.heritage,
        countryOfOrigin: otherUser?.countryOfOrigin,
        cityOfOrigin: otherUser?.cityOfOrigin,
        religion: otherUser?.religion || otherUser?.faith,
        lookingFor: otherUser?.lookingFor,
        interests: otherUser?.interests,
        profilePhoto,
        photo: profilePhoto,
        bio: otherUser?.bio,
      }
    })

    return enriched
      .sort((a, b) => {
        if (a.priorityScore !== b.priorityScore) return a.priorityScore - b.priorityScore
        if ((b.matchPercent ?? 0) !== (a.matchPercent ?? 0)) return (b.matchPercent ?? 0) - (a.matchPercent ?? 0)
        const aUpdated = new Date(a.updatedAt || a.confirmedAt || 0).getTime()
        const bUpdated = new Date(b.updatedAt || b.confirmedAt || 0).getTime()
        return bUpdated - aUpdated
      })
      .map(({ priorityScore, updatedAt, ...rest }) => rest)
  }

  static async getBoostStrip(userId: string) {
    const db = await getMongoDb()
    const collection = db.collection<BoostSessionDocument>('boost_sessions')
    const now = new Date()
    const active = await collection
      .find({ userId: new ObjectId(userId), status: 'active', endsAt: { $gte: now } })
      .sort({ endsAt: 1 })
      .toArray()
    const upcoming = await collection
      .find({ userId: new ObjectId(userId), status: { $in: ['pending', 'cleared'] }, startedAt: { $gte: now } })
      .sort({ startedAt: 1 })
      .toArray()
    return {
      active: active.map((session) => ({
        sessionId: session._id?.toHexString(),
        placement: session.placement,
        endsAt: session.endsAt.toISOString(),
      })),
      upcoming: upcoming.map((session) => ({
        sessionId: session._id?.toHexString(),
        placement: session.placement,
        startsAt: session.startedAt.toISOString(),
      })),
    }
  }

  private static async recordInteraction(kind: InteractionKind, actorId: string, targetId: string, context?: InteractionContextInput) {
    return withSpan(`interaction.${kind}`, async () => {
      const actor = new ObjectId(actorId)
      const target = new ObjectId(targetId)
      await this.assertQuota(actor, kind)

      const db = await getMongoDb()
      const collection = kind === 'like'
        ? db.collection<LikeDocument>('likes')
        : db.collection<SuperLikeDocument>('super_likes')

      const normalizedContext = this.normalizeContext(context)
      const basePayload = {
        actorId: actor,
        targetId: target,
        context: normalizedContext,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const payload = kind === 'like'
        ? { ...basePayload, type: 'like' as const }
        : { ...basePayload, boostScore: Math.max(1, (context as { boostScore?: number } | undefined)?.boostScore ?? 2) }

      await collection.updateOne(
        { actorId: actor, targetId: target },
        { $set: payload },
        { upsert: true },
      )

      await this.recordEvent(actor, target, kind, normalizedContext)

      const mutual = await db.collection<LikeDocument>('likes').findOne({ actorId: target, targetId: actor })
      if (mutual) {
        await this.createMatch(actorId, targetId)
      }

      await AnalyticsService.track({
        eventType: `discover.${kind}`,
        userId: actorId,
        properties: { targetId, source: normalizedContext.source },
      })

      return { success: true, mutual: Boolean(mutual) }
    }, { actorId, targetId, kind })
  }

  private static async recordEvent(actorId: ObjectId, targetId: ObjectId, event: InteractionEventDocument['event'], metadata?: Record<string, unknown>) {
    const db = await getMongoDb()
    const events = db.collection<InteractionEventDocument>('interaction_events')
    await events.insertOne({
      actorId,
      targetId,
      event,
      metadata: metadata ?? {},
      source: 'discovery',
      createdAt: new Date(),
      updatedAt: new Date(),
    })
  }

  private static async assertQuota(userId: ObjectId, kind: InteractionKind) {
    const limit = DAILY_LIMITS[kind]
    const since = new Date(Date.now() - 1000 * 60 * 60 * 24)
    const db = await getMongoDb()
    const events = await db.collection<InteractionEventDocument>('interaction_events').countDocuments({
      actorId: userId,
      event: kind,
      createdAt: { $gte: since },
    })
    if (events >= limit) {
      throw new Error(`${kind} quota exceeded`)
    }
  }

  private static normalizeContext(context?: InteractionContextInput): PersistedInteractionContext {
    return {
      source: context?.source ?? 'discovery',
      device: context?.device,
      location: context?.location,
      recipeId: context?.recipeId,
    }
  }

  private static async createMatch(actorId: string, targetId: string) {
    const db = await getMongoDb()
    const matches = db.collection<MatchDocument>('matches')
    const actorObjectId = new ObjectId(actorId)
    const targetObjectId = new ObjectId(targetId)
    const pairHash = MatchingService.pairHash(actorId, targetId)
    const memberIds = [actorObjectId, targetObjectId].sort((a, b) => a.toHexString().localeCompare(b.toHexString()))

    const snapshot = await MatchingService.getOrBuildSnapshot(actorId)
    const candidate = snapshot.candidates.find((c) => c.candidateId.equals(targetObjectId))
    const score = candidate?.score ?? 0.6
    const aiOpener = candidate
      ? `Concierge predicts a ${Math.round(score * 100)}% harmony. Ask about their favorite ritual?`
      : 'Concierge sees promise—open with a story about your latest gathering.'

    await matches.updateOne(
      { pairHash },
      {
        $set: {
          pairHash,
          memberIds,
          initiatedBy: actorObjectId,
          score,
          scoreBreakdown: candidate?.scoreBreakdown ?? {},
          state: 'open',
          aiOpener,
          confirmedAt: new Date(),
          lastInteractionAt: new Date(),
          updatedAt: new Date(),
          createdAt: new Date(),
        },
      },
      { upsert: true },
    )

    await this.recordEvent(actorObjectId, targetObjectId, 'match_confirmed', { score })
    await AnalyticsService.track({ eventType: 'discover.match_confirmed', userId: actorId, properties: { targetId, score } })
  }
}
