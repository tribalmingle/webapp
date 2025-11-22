import { ObjectId } from 'mongodb'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { dispatchLivenessProviderCheck } from '@/lib/trust/liveness-provider-dispatcher'
import { createTrustEvent } from '@/lib/trust/trust-event-service'
import { trackServerEvent } from '@/lib/analytics/segment'
import { MissingLivenessProviderEndpointError, requestProviderReview } from '@/lib/trust/liveness-provider-adapter'

vi.mock('@/lib/analytics/segment', () => ({
  trackServerEvent: vi.fn(),
}))

vi.mock('@/lib/trust/trust-event-service', () => ({
  createTrustEvent: vi.fn(),
}))

vi.mock('@/lib/trust/liveness-provider-adapter', async () => {
  const actual = await vi.importActual<typeof import('@/lib/trust/liveness-provider-adapter')>('@/lib/trust/liveness-provider-adapter')
  return {
    ...actual,
    requestProviderReview: vi.fn(),
  }
})

const baseSession: any = {
  _id: new ObjectId('507f1f77bcf86cd799439011'),
  sessionToken: 'token-abc',
  intent: 'onboarding',
  locale: 'en',
  memberId: new ObjectId('507f1f77bcf86cd799439022'),
}

const artifacts = {
  photoKey: 'photo-key',
  videoKey: 'video-key',
}

describe('dispatchLivenessProviderCheck', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('sends payload to provider when configured', async () => {
    vi.mocked(requestProviderReview).mockResolvedValue({ providerSessionId: 'provider-123', status: 'queued' })

    const result = await dispatchLivenessProviderCheck({ session: baseSession, artifacts })

    expect(result.mode).toBe('provider')
    expect(result.providerSessionId).toBe('provider-123')
    expect(requestProviderReview).toHaveBeenCalledWith(
      expect.objectContaining({ sessionToken: 'token-abc', memberId: baseSession.memberId.toString() }),
    )
    expect(trackServerEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        event: 'liveness.provider.dispatch',
        properties: expect.objectContaining({ sessionToken: 'token-abc', status: 'queued' }),
      }),
    )
    expect(createTrustEvent).not.toHaveBeenCalled()
  })

  it('falls back to manual review when provider unavailable', async () => {
    vi.mocked(requestProviderReview).mockRejectedValue(new MissingLivenessProviderEndpointError())

    const result = await dispatchLivenessProviderCheck({ session: baseSession, artifacts })

    expect(result.mode).toBe('manual-review')
    expect(createTrustEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'liveness_manual_check',
        userId: baseSession.memberId,
      }),
    )
    expect(trackServerEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        event: 'liveness.provider.dispatch',
        properties: expect.objectContaining({ fallback: true }),
      }),
    )
  })
})
