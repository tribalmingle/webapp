import { describe, expect, it, vi } from 'vitest'

import { POST as createSessionHandler } from '@/app/api/trust/liveness/session/route'
import { POST as completeSessionHandler } from '@/app/api/trust/liveness/session/[sessionToken]/complete/route'
import { createLivenessSession, markSessionAwaitingProvider } from '@/lib/trust/liveness-session-service'
import { getCurrentUser } from '@/lib/auth'
import { dispatchLivenessProviderCheck } from '@/lib/trust/liveness-provider-dispatcher'

vi.mock('@/lib/auth', () => ({
  getCurrentUser: vi.fn(),
}))

vi.mock('@/lib/trust/liveness-session-service', () => ({
  createLivenessSession: vi.fn(),
  markSessionAwaitingProvider: vi.fn(),
}))

vi.mock('@/lib/trust/liveness-provider-dispatcher', () => ({
  dispatchLivenessProviderCheck: vi.fn(),
}))

describe('liveness session API', () => {
  it('creates a session for authenticated user', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ userId: '507f1f77bcf86cd799439011', email: 'member@example.com' } as any)
    vi.mocked(createLivenessSession).mockResolvedValue({
      _id: { toString: () => 'sessionId' },
      sessionToken: 'token-123',
      uploadUrls: { photo: 'photo-url', video: 'video-url' },
      expiresAt: new Date('2025-01-01T00:00:00Z'),
      status: 'awaiting_upload',
    } as any)

    const request = new Request('https://tribalmingle.test/api/trust/liveness/session', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ intent: 'onboarding', device: 'web', locale: 'fr' }),
    })

    const response = await createSessionHandler(request)
    expect(response.status).toBe(200)
    const payload = await response.json()
    expect(payload.success).toBe(true)
    expect(payload.sessionToken).toBe('token-123')
    expect(createLivenessSession).toHaveBeenCalledWith(
      expect.objectContaining({ memberId: '507f1f77bcf86cd799439011', locale: 'fr' }),
    )
  })

  it('completes a session and marks awaiting provider', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ userId: '507f1f77bcf86cd799439011', email: 'member@example.com' } as any)
    vi.mocked(markSessionAwaitingProvider).mockResolvedValue({
      sessionToken: 'token-abc',
      status: 'awaiting_provider',
      provider: { decision: 'pending' },
      retryCount: 0,
      artifacts: {
        photoKey: 'photo-key',
        videoKey: 'video-key',
      },
    } as any)

    const request = new Request('https://tribalmingle.test/api/trust/liveness/session/token-abc/complete', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        artifacts: {
          photoKey: 'photo-key',
          videoKey: 'video-key',
        },
      }),
    })

    const response = await completeSessionHandler(request, { params: Promise.resolve({ sessionToken: 'token-abc' }) })
    expect(response.status).toBe(200)
    const payload = await response.json()
    expect(payload.success).toBe(true)
    expect(payload.status).toBe('awaiting_provider')

    expect(markSessionAwaitingProvider).toHaveBeenCalledWith(
      expect.objectContaining({ sessionToken: 'token-abc', memberId: '507f1f77bcf86cd799439011' }),
    )

    expect(dispatchLivenessProviderCheck).toHaveBeenCalledWith(
      expect.objectContaining({
        session: expect.objectContaining({ sessionToken: 'token-abc' }),
        artifacts: expect.objectContaining({ photoKey: 'photo-key' }),
      }),
    )
  })

  it('requires authentication for both routes', async () => {
    vi.mocked(getCurrentUser).mockResolvedValueOnce(null).mockResolvedValueOnce(null)

    const createResponse = await createSessionHandler(new Request('https://tribalmingle.test/api/trust/liveness/session', { method: 'POST' }))
    expect(createResponse.status).toBe(401)

    const completeResponse = await completeSessionHandler(new Request('https://tribalmingle.test/api/trust/liveness/session/token/complete', { method: 'POST' }), {
      params: Promise.resolve({ sessionToken: 'token' }),
    })
    expect(completeResponse.status).toBe(401)
  })
})
