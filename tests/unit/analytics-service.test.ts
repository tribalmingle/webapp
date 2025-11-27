// Using global Jest types (no direct @jest/globals import needed)
import { AnalyticsService } from '@/lib/services/analytics-service'
import { getMongoDb } from '@/lib/mongodb'

let startDate: Date
let endDate: Date

describe('AnalyticsService', () => {
  beforeAll(async () => {
    const db = await getMongoDb()
    const events = db.collection('analytics_events')
    startDate = new Date(Date.now() - 3 * 86400000)
    endDate = new Date()
    const base = [
      { eventType: 'user.signup', timestamp: new Date(Date.now() - 3 * 86400000) },
      { eventType: 'profile.created', timestamp: new Date(Date.now() - 2 * 86400000) },
      { eventType: 'subscription.upgraded', timestamp: new Date(Date.now() - 1 * 86400000) },
    ]
    await events.insertMany(base)
  })

  afterAll(async () => {
    const db = await getMongoDb()
    await db.collection('analytics_events').deleteMany({})
  })

  it('runs funnel analysis', async () => {
    const funnel = await AnalyticsService.analyzeFunnel({
      steps: ['user.signup', 'profile.created', 'subscription.upgraded'],
      startDate: new Date(Date.now() - 5 * 86400000),
      endDate: new Date()
    })
    expect(funnel.length).toBe(3)
    expect(funnel[0].users).toBeGreaterThan(0)
  })

  it('queries metrics count grouped by date', async () => {
    const results = await AnalyticsService.queryMetrics({
      eventType: 'user.signup',
      startDate,
      endDate,
      aggregation: 'count',
      groupBy: 'date'
    })
    expect(Array.isArray(results)).toBe(true)
  })
})
