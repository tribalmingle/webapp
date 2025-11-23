import {
  GraphQLBoolean,
  GraphQLFloat,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLSchema,
  GraphQLString,
} from 'graphql'

import { DiscoveryService } from '@/lib/services/discovery-service'
import { MatchingService } from '@/lib/services/matching-service'
import { InteractionService } from '@/lib/services/interaction-service'
// Phase 7 additions
import { getSubscription } from '@/lib/services/subscription-service'
import { getSnapshot } from '@/lib/services/wallet-service'
import { getReferralProgress, generateOrGetExistingCode } from '@/lib/services/referral-service'
import { getRealtimeStats, listRecentSnapshots } from '@/lib/services/analytics-service'

interface GraphQLContext {
  userId: string
}

const ScoreBreakdown = new GraphQLObjectType({
  name: 'ScoreBreakdown',
  fields: {
    compatibility: { type: GraphQLFloat },
    culture: { type: GraphQLFloat },
    intent: { type: GraphQLFloat },
    boost: { type: GraphQLFloat },
  },
})

const DiscoveryCandidate = new GraphQLObjectType({
  name: 'DiscoveryCandidate',
  fields: {
    id: { type: new GraphQLNonNull(GraphQLString), resolve: (candidate: any) => candidate.candidateId },
    name: { type: GraphQLString, resolve: (candidate: any) => candidate.profile?.name },
    tribe: { type: GraphQLString, resolve: (candidate: any) => candidate.profile?.tribe },
    city: { type: GraphQLString, resolve: (candidate: any) => candidate.profile?.location?.city },
    matchScore: { type: GraphQLFloat },
    conciergePrompt: { type: GraphQLString },
    aiOpener: { type: GraphQLString },
    trustBadges: { type: new GraphQLList(GraphQLString) },
    scoreBreakdown: { type: ScoreBreakdown },
  },
})

const MatchInsightType = new GraphQLObjectType({
  name: 'MatchInsight',
  fields: {
    matchId: { type: GraphQLString },
    score: { type: GraphQLFloat },
    aiOpener: { type: GraphQLString },
    confirmedAt: { type: GraphQLString },
    trustBadges: { type: new GraphQLList(GraphQLString) },
    sharedValues: {
      type: new GraphQLList(GraphQLString),
      resolve: (match: any) => match.insights?.sharedValues ?? [],
    },
    conciergePrompt: {
      type: GraphQLString,
      resolve: (match: any) => match.insights?.conciergePrompt ?? null,
    },
    isActive: {
      type: GraphQLBoolean,
      resolve: (match: any) => match.state === 'open',
    },
  },
})

const QueryType = new GraphQLObjectType({
  name: 'Query',
  fields: {
    discoveryFeed: {
      type: new GraphQLList(DiscoveryCandidate),
      args: {
        mode: { type: GraphQLString },
        recipeId: { type: GraphQLString },
      },
      resolve: async (_source, args, context: GraphQLContext) => {
        const feed = await DiscoveryService.getFeed(context.userId, { mode: (args.mode as any) ?? 'swipe', recipeId: args.recipeId ?? undefined })
        return feed.candidates
      },
    },
    matchSuggestions: {
      type: new GraphQLList(DiscoveryCandidate),
      resolve: async (_source, _args, context: GraphQLContext) => MatchingService.getRankedCandidates(context.userId),
    },
    matchInsights: {
      type: MatchInsightType,
      args: { matchId: { type: new GraphQLNonNull(GraphQLString) } },
      resolve: async (_source, args, context: GraphQLContext) => {
        const matches = await InteractionService.getMatches(context.userId)
        return matches.find((match) => match.matchId === args.matchId)
      },
    },
    subscription: {
      type: new GraphQLObjectType({
        name: 'SubscriptionInfo',
        fields: {
          plan: { type: GraphQLString },
          status: { type: GraphQLString },
          trialEndsAt: { type: GraphQLString },
          renewsAt: { type: GraphQLString },
        }
      }),
      resolve: async (_s, _a, ctx: GraphQLContext) => {
        const sub = await getSubscription(ctx.userId)
        if (!sub) return null
        return {
          plan: sub.plan,
          status: sub.status,
          trialEndsAt: sub.trialEndsAt?.toISOString() ?? null,
          renewsAt: sub.renewsAt?.toISOString() ?? null,
        }
      }
    },
    wallet: {
      type: new GraphQLObjectType({
        name: 'WalletSnapshot',
        fields: {
          balance: { type: GraphQLFloat },
          transactions: { type: new GraphQLList(new GraphQLObjectType({
            name: 'WalletTx',
            fields: {
              id: { type: GraphQLString },
              type: { type: GraphQLString },
              amount: { type: GraphQLFloat },
              reference: { type: GraphQLString },
              createdAt: { type: GraphQLString }
            }
          })) }
        }
      }),
      resolve: async (_s, _a, ctx: GraphQLContext) => {
        const snap = await getSnapshot(ctx.userId)
        return {
          balance: snap.balance,
          transactions: snap.transactions.slice(0, 50).map(t => ({
            id: t.id,
            type: t.type,
            amount: t.amount,
            reference: t.reference ?? null,
            createdAt: t.createdAt.toISOString()
          }))
        }
      }
    },
    referralProgress: {
      type: new GraphQLObjectType({
        name: 'ReferralProgress',
        fields: {
          codes: { type: new GraphQLList(GraphQLString) },
          clicks: { type: GraphQLFloat },
          signups: { type: GraphQLFloat },
          verified: { type: GraphQLFloat },
          rewards: { type: GraphQLFloat }
        }
      }),
      resolve: async (_s, _a, ctx: GraphQLContext) => {
        // Ensure at least one code exists
        await generateOrGetExistingCode(ctx.userId)
        const progress = await getReferralProgress(ctx.userId)
        return {
          codes: progress.codes,
          clicks: progress.stats.clicks,
          signups: progress.stats.signups,
          verified: progress.stats.verified,
          rewards: progress.stats.rewards,
        }
      }
    },
    statsRealtime: {
      type: new GraphQLObjectType({
        name: 'RealtimeStats',
        fields: {
          activeUsers: { type: GraphQLFloat },
          onlineNow: { type: GraphQLFloat },
          coinsSpentToday: { type: GraphQLFloat },
          giftsSentToday: { type: GraphQLFloat },
          subscriptionRenewalsToday: { type: GraphQLFloat },
        }
      }),
      resolve: async () => await getRealtimeStats()
    },
    dailySnapshots: {
      type: new GraphQLList(new GraphQLObjectType({
        name: 'DailyMetricSnapshot',
        fields: {
          date: { type: GraphQLString },
          activeUsers: { type: GraphQLFloat },
          giftsSent: { type: GraphQLFloat },
          coinSpent: { type: GraphQLFloat },
          newSubscriptions: { type: GraphQLFloat },
          referralSignups: { type: GraphQLFloat },
        }
      })),
      args: { limit: { type: GraphQLFloat } },
      resolve: async (_s, args) => listRecentSnapshots(args.limit ? Math.min(args.limit, 60) : 30)
    }
  },
})

export const schema = new GraphQLSchema({
  query: QueryType,
})
