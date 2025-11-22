import { beforeEach, describe, expect, it, vi } from 'vitest'

import { POST as providerWebhookHandler } from '@/app/api/trust/liveness/provider-webhook/route'
import { trackServerEvent } from '@/lib/analytics/segment'
import { applyProviderDecision, getLivenessSessionByToken, incrementWebhookAttempt } from '@/lib/trust/liveness-session-service'
import { createTrustEvent } from '@/lib/trust/trust-event-service'

vi.mock('@/lib/analytics/segment', () => ({
  trackServerEvent: vi.fn(),
}))

vi.mock('@/lib/trust/liveness-session-service', () => ({
  applyProviderDecision: vi.fn(),
  getLivenessSessionByToken: vi.fn(),
  incrementWebhookAttempt: vi.fn(),
}))

vi.mock('@/lib/trust/trust-event-service', () => ({
  createTrustEvent: vi.fn(),
}))

describe('liveness provider webhook', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('tracks provider decisions', async () => {
    vi.mocked(getLivenessSessionByToken).mockResolvedValue({
      sessionToken: 'session-token-1',
      memberId: '507f1f77bcf86cd799439011',
      intent: 'onboarding',
      device: 'web',
      locale: 'en',
    } as any)

    vi.mocked(applyProviderDecision).mockResolvedValue({
      status: 'passed',
      provider: { decision: 'pass' },
    } as any)

    const request = new Request('https://tribalmingle.test/api/trust/liveness/provider-webhook', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        sessionToken: 'session-token-1',
        provider: 'mock-provider',
        decision: 'pass',
        confidence: 0.94,
      }),
    })

    const response = await providerWebhookHandler(request)
    expect(response.status).toBe(200)
    const payload = await response.json()
    expect(payload.success).toBe(true)

    expect(incrementWebhookAttempt).toHaveBeenCalledWith('session-token-1')
    expect(applyProviderDecision).toHaveBeenCalledWith(
      expect.objectContaining({ sessionToken: 'session-token-1', decision: 'pass', provider: 'mock-provider' }),
    )
    expect(trackServerEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        event: 'liveness.provider.decision',
        userId: '507f1f77bcf86cd799439011',
      }),
    )
    expect(createTrustEvent).not.toHaveBeenCalled()
  })

  it('enqueues trust events on fallback decisions', async () => {
    vi.mocked(getLivenessSessionByToken).mockResolvedValue({
      _id: 'session-object-id',
      sessionToken: 'session-token-2',
      memberId: '507f1f77bcf86cd799439011',
      intent: 'onboarding',
      device: 'web',
      locale: 'en',
    } as any)

    vi.mocked(applyProviderDecision).mockResolvedValue({
      status: 'manual_review',
      provider: { decision: 'fallback' },
    } as any)

    const request = new Request('https://tribalmingle.test/api/trust/liveness/provider-webhook', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        sessionToken: 'session-token-2',
        provider: 'mock-provider',
        decision: 'fallback',
        reasons: ['low_light'],
      }),
    })

    const response = await providerWebhookHandler(request)
    expect(response.status).toBe(200)

    expect(createTrustEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'liveness_manual_check',
        userId: '507f1f77bcf86cd799439011',
        context: expect.objectContaining({ reasons: ['low_light'], sessionToken: 'session-token-2' }),
        relatedIds: ['session-object-id'],
      }),
    )
  })
})
