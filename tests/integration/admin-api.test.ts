import { describe, it, expect } from 'vitest'

describe('Admin API Integration Tests', () => {
  const BASE_URL = process.env.TEST_API_URL || 'http://localhost:3000'

  describe('CRM API', () => {
    it('should search users', async () => {
      const response = await fetch(`${BASE_URL}/api/admin/crm/search?query=test`)
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(Array.isArray(data)).toBe(true)
    })

    it('should add note to user', async () => {
      const response = await fetch(`${BASE_URL}/api/admin/crm/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'test123',
          content: 'Integration test note',
          category: 'support',
          createdBy: 'admin',
        }),
      })
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.noteId).toBeDefined()
    })
  })

  describe('Support API', () => {
    let testTicketId: string

    it('should create ticket', async () => {
      const response = await fetch(`${BASE_URL}/api/admin/support/tickets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'test123',
          subject: 'Integration Test',
          description: 'Test ticket',
          priority: 'medium',
          category: 'account',
        }),
      })
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.ticketId).toBeDefined()
      testTicketId = data.ticketId
    })

    it('should list tickets', async () => {
      const response = await fetch(`${BASE_URL}/api/admin/support/tickets?status=open`)
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(Array.isArray(data)).toBe(true)
    })

    it('should add message to ticket', async () => {
      const response = await fetch(`${BASE_URL}/api/admin/support/tickets/${testTicketId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: 'Test message',
          senderId: 'agent1',
          senderType: 'agent',
        }),
      })
      expect(response.status).toBe(200)
    })
  })

  describe('Feature Flags API', () => {
    const testKey = 'integration_test_' + Date.now()

    it('should create feature flag', async () => {
      const response = await fetch(`${BASE_URL}/api/admin/labs/flags`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: testKey,
          name: 'Integration Test Flag',
          enabled: false,
          rolloutPercentage: 0,
          createdBy: 'admin',
        }),
      })
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.flagId).toBeDefined()
    })

    it('should list feature flags', async () => {
      const response = await fetch(`${BASE_URL}/api/admin/labs/flags`)
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(Array.isArray(data)).toBe(true)
      expect(data.some((f: any) => f.key === testKey)).toBe(true)
    })

    it('should toggle feature flag', async () => {
      const response = await fetch(`${BASE_URL}/api/admin/labs/flags/${testKey}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle' }),
      })
      expect(response.status).toBe(200)
    })
  })

  describe('Analytics API', () => {
    it('should query metrics', async () => {
      const response = await fetch(`${BASE_URL}/api/admin/analytics/metrics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startDate: new Date(Date.now() - 7 * 86400000).toISOString(),
          endDate: new Date().toISOString(),
          aggregation: 'count',
          groupBy: 'date',
        }),
      })
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(Array.isArray(data)).toBe(true)
    })

    it('should analyze funnel', async () => {
      const response = await fetch(`${BASE_URL}/api/admin/analytics/funnel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          steps: ['user.signup', 'profile.created', 'subscription.upgraded'],
          startDate: new Date(Date.now() - 30 * 86400000).toISOString(),
          endDate: new Date().toISOString(),
        }),
      })
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(Array.isArray(data)).toBe(true)
      expect(data.length).toBe(3)
    })
  })

  describe('System Health API', () => {
    it('should return health status', async () => {
      const response = await fetch(`${BASE_URL}/api/admin/system/health`)
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.status).toBeDefined()
      expect(data.checks).toBeDefined()
      expect(Array.isArray(data.checks)).toBe(true)
    })
  })
})
