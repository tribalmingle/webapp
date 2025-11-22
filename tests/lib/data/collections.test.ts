import { describe, expect, it } from 'vitest'

import { collectionRegistry } from '../../../lib/data/collections'

const registryEntries = Object.entries(collectionRegistry)

describe('collection registry', () => {
  it('enforces timestamps on every validator', () => {
    for (const [name, definition] of registryEntries) {
      const schema = definition.validator.$jsonSchema
      const required = schema.required ?? []

      expect(required, `${name} must require createdAt`).toContain('createdAt')
      expect(required, `${name} must require updatedAt`).toContain('updatedAt')
      expect(schema.properties.createdAt, `${name} should describe createdAt`).toHaveProperty('bsonType', 'date')
      expect(schema.properties.updatedAt, `${name} should describe updatedAt`).toHaveProperty('bsonType', 'date')
    }
  })

  it('declares unique indexes for key identity constraints', () => {
    const expectations: Record<string, string[]> = {
      users: ['email_unique'],
      profiles: ['user_unique'],
      likes: ['like_actor_target_unique'],
      chat_threads: ['thread_participant_hash_unique'],
      notifications: ['notification_dedupe_unique'],
      events: ['event_slug_unique'],
      event_registrations: ['registration_event_user_unique'],
      subscriptions: ['subscription_provider_unique'],
      payments: ['payment_provider_unique'],
      invoices: ['invoice_subscription_period_unique'],
      entitlements: ['entitlement_user_feature_unique'],
      analytics_snapshots: ['analytics_type_range_window_unique'],
      funnel_metrics: ['funnel_step_window_unique'],
      cohort_metrics: ['cohort_week_unique'],
      activity_logs: ['activity_hash_unique'],
      gamification_states: ['gamification_user_unique'],
      referrals: ['referral_code_unique'],
      advocates: ['advocate_program_user_unique'],
    }

    for (const [collectionName, expectedIndexes] of Object.entries(expectations)) {
      const definition = collectionRegistry[collectionName as keyof typeof collectionRegistry]
      const uniqueIndexes = definition.indexes.filter((idx) => idx.unique).map((idx) => idx.name)

      for (const expected of expectedIndexes) {
        expect(uniqueIndexes, `${collectionName} missing unique index ${expected}`).toContain(expected)
      }
    }
  })

  it('includes TTL indexes for ephemeral collections', () => {
    const ttlExpectations: Record<string, { name: string; expireAfterSeconds: number }> = {
      matching_snapshots: { name: 'snapshot_ttl_idx', expireAfterSeconds: 60 * 60 * 24 * 7 },
      boost_sessions: { name: 'boost_expiry_ttl', expireAfterSeconds: 0 },
      rewinds: { name: 'rewind_expiry_ttl', expireAfterSeconds: 0 },
      chat_messages: { name: 'message_ephemeral_ttl', expireAfterSeconds: 0 },
      moderation_actions: { name: 'moderation_expiry_ttl', expireAfterSeconds: 0 },
      trust_events: { name: 'trust_event_expiry_ttl', expireAfterSeconds: 0 },
      liveness_sessions: { name: 'liveness_session_expiry_idx', expireAfterSeconds: 0 },
      entitlements: { name: 'entitlement_expiry_ttl', expireAfterSeconds: 0 },
      ai_recommendations: { name: 'ai_recommendation_expiry_ttl', expireAfterSeconds: 0 },
    }

    for (const [collectionName, expectation] of Object.entries(ttlExpectations)) {
      const definition = collectionRegistry[collectionName as keyof typeof collectionRegistry]
      const ttlIndex = definition.indexes.find((idx) => idx.name === expectation.name)

      expect(ttlIndex, `${collectionName} missing TTL index ${expectation.name}`).toBeDefined()
      expect(ttlIndex?.expireAfterSeconds, `${collectionName} TTL mismatch`).toBe(expectation.expireAfterSeconds)
    }
  })
})
