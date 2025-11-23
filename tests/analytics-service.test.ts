/**
 * Phase 6: Analytics Service Tests
 * Tests for event counting and funnel conversion analytics
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals'
import { AnalyticsService } from '@/lib/services/analytics-service'
import { getCollection } from '@/lib/db/mongodb'
import { COLLECTIONS, AnalyticsEvent } from '@/lib/db/collections'
import { MongoClient } from 'mongodb'

describe('AnalyticsService', () => {
  let mongoClient: MongoClient

  beforeAll(async () => {
    // Clean up test data
    const collection = await getCollection<AnalyticsEvent>(COLLECTIONS.ANALYTICS_EVENTS)
    await collection.deleteMany({ eventType: { $regex: /^test\./ } })
  })

  afterAll(async () => {
    // Cleanup
    const collection = await getCollection<AnalyticsEvent>(COLLECTIONS.ANALYTICS_EVENTS)
    await collection.deleteMany({ eventType: { $regex: /^test\./ } })
  })

  describe('getEventCounts', () => {
    it('should count events by type in date range', async () => {
      const collection = await getCollection<AnalyticsEvent>(COLLECTIONS.ANALYTICS_EVENTS)
      
      // Insert test events
      const now = new Date()
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
      const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000)

      await collection.insertMany([
        { eventType: 'test.signup', timestamp: yesterday, userId: 'user1' },
        { eventType: 'test.signup', timestamp: yesterday, userId: 'user2' },
        { eventType: 'test.login', timestamp: yesterday, userId: 'user1' },
        { eventType: 'test.signup', timestamp: twoDaysAgo, userId: 'user3' }, // outside range
      ])

      const startDate = new Date(yesterday.getTime() - 1000)
      const endDate = new Date(now.getTime() + 1000)

      const counts = await AnalyticsService.getEventCounts(startDate, endDate)

      const signupCount = counts.find((c: any) => c._id === 'test.signup')
      const loginCount = counts.find((c: any) => c._id === 'test.login')

      expect(signupCount?.count).toBe(2)
      expect(loginCount?.count).toBe(1)
    })

    it('should return empty array when no events in range', async () => {
      const futureStart = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
      const futureEnd = new Date(futureStart.getTime() + 1000)

      const counts = await AnalyticsService.getEventCounts(futureStart, futureEnd)
      expect(counts).toEqual([])
    })
  })

  describe('getFunnelData', () => {
    it('should calculate funnel with dropoff rates', async () => {
      const collection = await getCollection<AnalyticsEvent>(COLLECTIONS.ANALYTICS_EVENTS)
      
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
      const now = new Date()

      // Create funnel: 100 signups -> 60 profiles -> 30 swipes
      const events: AnalyticsEvent[] = []
      for (let i = 0; i < 100; i++) {
        events.push({ eventType: 'test.funnel.signup', timestamp: yesterday, userId: `user${i}` })
      }
      for (let i = 0; i < 60; i++) {
        events.push({ eventType: 'test.funnel.profile', timestamp: yesterday, userId: `user${i}` })
      }
      for (let i = 0; i < 30; i++) {
        events.push({ eventType: 'test.funnel.swipe', timestamp: yesterday, userId: `user${i}` })
      }

      await collection.insertMany(events)

      const steps = ['test.funnel.signup', 'test.funnel.profile', 'test.funnel.swipe']
      const funnel = await AnalyticsService.getFunnelData(steps, yesterday, now)

      expect(funnel).toHaveLength(3)
      
      expect(funnel[0].step).toBe(1)
      expect(funnel[0].name).toBe('test.funnel.signup')
      expect(funnel[0].count).toBe(100)
      expect(funnel[0].dropoff).toBe(0) // First step has no dropoff

      expect(funnel[1].step).toBe(2)
      expect(funnel[1].name).toBe('test.funnel.profile')
      expect(funnel[1].count).toBe(60)
      expect(funnel[1].dropoff).toBe(40) // (100 - 60) / 100 * 100 = 40%

      expect(funnel[2].step).toBe(3)
      expect(funnel[2].name).toBe('test.funnel.swipe')
      expect(funnel[2].count).toBe(30)
      expect(funnel[2].dropoff).toBe(50) // (60 - 30) / 60 * 100 = 50%
    })

    it('should handle empty funnel gracefully', async () => {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
      const now = new Date()

      const steps = ['test.nonexistent.step1', 'test.nonexistent.step2']
      const funnel = await AnalyticsService.getFunnelData(steps, yesterday, now)

      expect(funnel).toHaveLength(2)
      expect(funnel[0].count).toBe(0)
      expect(funnel[1].count).toBe(0)
      expect(funnel[1].dropoff).toBe(0) // No dropoff when prev is 0
    })
  })

  describe('getActiveUsers', () => {
    it('should count active users in time window', async () => {
      const count = await AnalyticsService.getActiveUsers(5)
      expect(typeof count).toBe('number')
      expect(count).toBeGreaterThanOrEqual(0)
    })
  })
})
