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
  },
})

export const schema = new GraphQLSchema({
  query: QueryType,
})
