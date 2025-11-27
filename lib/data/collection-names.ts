/**
 * Collection name constants for MongoDB operations
 * This provides a convenient way to access collection names
 */

import { COLLECTIONS } from './collections'

export const CollectionNames = {
  USERS: COLLECTIONS.users.name,
  USER_PREFERENCES: COLLECTIONS.profiles.name, // Profile contains preferences
  USER_PHOTOS: COLLECTIONS.profiles.name, // Photos are in profiles
  USER_MATCHES: COLLECTIONS.matches.name,
  USER_BLOCKS: COLLECTIONS.reports.name, // Blocks tracked in reports
  CHAT_MESSAGES: COLLECTIONS.chat_messages.name,
  CONVERSATIONS: COLLECTIONS.chat_threads.name,
  GIFTS: COLLECTIONS.chat_messages.name, // Gifts are chat messages
  COMMUNITY_EVENTS: COLLECTIONS.events.name,
  EVENT_RSVPS: COLLECTIONS.event_registrations.name,
  COMMUNITY_POSTS: COLLECTIONS.community_posts.name,
  POST_COMMENTS: COLLECTIONS.community_comments.name,
  POST_REACTIONS: COLLECTIONS.community_posts.name, // Reactions on posts
  SAFETY_REPORTS: COLLECTIONS.reports.name,
  NOTIFICATIONS: COLLECTIONS.notifications.name,
  SUBSCRIPTIONS: COLLECTIONS.subscriptions.name,
  TRANSACTIONS: COLLECTIONS.payments.name,
  BOOSTS: COLLECTIONS.boost_sessions.name,
  SUPPORT_TICKETS: COLLECTIONS.reports.name, // Support tickets in reports
  ANALYTICS_EVENTS: COLLECTIONS.activity_logs.name,
  CAMPAIGNS: COLLECTIONS.notifications.name, // Campaigns are notifications
  DATA_EXPORTS: 'data_exports',
  ACCOUNT_DELETIONS: 'account_deletions',
} as const
