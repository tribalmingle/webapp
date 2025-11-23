import type { z } from 'zod'

import { collectionRegistry, type CollectionName, type CollectionRegistry } from './collections'

export type CollectionSchema<Name extends CollectionName> = z.infer<CollectionRegistry[Name]['schema']>

export type CollectionDocument<Name extends CollectionName> = CollectionSchema<Name>

export type UserDocument = CollectionDocument<'users'>
export type ProfileDocument = CollectionDocument<'profiles'>
export type CompatibilityQuizDocument = CollectionDocument<'compatibility_quizzes'>
export type MatchingSnapshotDocument = CollectionDocument<'matching_snapshots'>
export type DiscoveryRecipeDocument = CollectionDocument<'discovery_recipes'>
export type InteractionEventDocument = CollectionDocument<'interaction_events'>
export type MatchDocument = CollectionDocument<'matches'>
export type LikeDocument = CollectionDocument<'likes'>
export type SuperLikeDocument = CollectionDocument<'super_likes'>
export type BoostSessionDocument = CollectionDocument<'boost_sessions'>
export type RewindDocument = CollectionDocument<'rewinds'>
export type ChatThreadDocument = CollectionDocument<'chat_threads'>
export type ChatMessageDocument = CollectionDocument<'chat_messages'>
export type NotificationDocument = CollectionDocument<'notifications'>
export type EventDocument = CollectionDocument<'events'>
export type EventRegistrationDocument = CollectionDocument<'event_registrations'>
export type CommunityClubDocument = CollectionDocument<'community_clubs'>
export type CommunityPostDocument = CollectionDocument<'community_posts'>
export type CommunityCommentDocument = CollectionDocument<'community_comments'>
export type ReportDocument = CollectionDocument<'reports'>
export type ModerationActionDocument = CollectionDocument<'moderation_actions'>
export type TrustEventDocument = CollectionDocument<'trust_events'>
export type LivenessSessionDocument = CollectionDocument<'liveness_sessions'>
export type GuardianInviteRequestDocument = CollectionDocument<'guardian_invite_requests'>
export type SubscriptionDocument = CollectionDocument<'subscriptions'>
export type PaymentDocument = CollectionDocument<'payments'>
export type WalletConfigDocument = CollectionDocument<'wallet_configs'>
export type InvoiceDocument = CollectionDocument<'invoices'>
export type EntitlementDocument = CollectionDocument<'entitlements'>
export type AnalyticsSnapshotDocument = CollectionDocument<'analytics_snapshots'>
export type FunnelMetricDocument = CollectionDocument<'funnel_metrics'>
export type CohortMetricDocument = CollectionDocument<'cohort_metrics'>
export type ActivityLogDocument = CollectionDocument<'activity_logs'>
export type GamificationStateDocument = CollectionDocument<'gamification_states'>
export type ReferralDocument = CollectionDocument<'referrals'>
export type AdvocateDocument = CollectionDocument<'advocates'>
export type AiRecommendationDocument = CollectionDocument<'ai_recommendations'>

export type CollectionDefinitionMap = CollectionRegistry
