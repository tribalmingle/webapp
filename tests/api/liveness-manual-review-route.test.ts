import { beforeEach, describe, expect, it, vi } from 'vitest'

import { POST as manualReviewHandler } from '@/app/api/trust/liveness/session/[sessionToken]/review/route'
import { trackServerEvent } from '@/lib/analytics/segment'
import { getCurrentUser } from '@/lib/auth'
import { appendActivityLog } from '@/lib/trust/activity-log-service'
import { resolveManualReview } from '@/lib/trust/liveness-session-service'
import { createTrustEvent } from '@/lib/trust/trust-event-service'

vi.mock('@/lib/auth', () => ({
  getCurrentUser: vi.fn(),
}))

vi.mock('@/lib/analytics/segment', () => ({
  trackServerEvent: vi.fn(),
}))

vi.mock('@/lib/trust/liveness-session-service', () => ({
  resolveManualReview: vi.fn(),
}))

vi.mock('@/lib/trust/trust-event-service', () => ({
  createTrustEvent: vi.fn(),
}))

vi.mock('@/lib/trust/activity-log-service', () => ({
  appendActivityLog: vi.fn(),
}))

describe('liveness manual review route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('allows reviewers to record decisions', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ userId: '507f1f77bcf86cd799439011', roles: ['trust'] } as any)
    vi.mocked(resolveManualReview).mockResolvedValue({
      _id: 'session-object-id',
      memberId: '507f1f77bcf86cd799439099',
      status: 'passed',
      provider: { decision: 'pass' },
    } as any)

    const request = new Request('https://tribalmingle.test/api/trust/liveness/session/token/review', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ resolution: 'approve', note: 'Looks good' }),
    })

    const response = await manualReviewHandler(request, { params: Promise.resolve({ sessionToken: 'session-token-1' }) })
    expect(response.status).toBe(200)

    expect(resolveManualReview).toHaveBeenCalledWith(
      expect.objectContaining({ sessionToken: 'session-token-1', resolution: 'approve' }),
    )
    expect(trackServerEvent).toHaveBeenCalledWith(expect.objectContaining({ event: 'liveness.manual.reviewed' }))
    expect(createTrustEvent).toHaveBeenCalled()
    expect(appendActivityLog).toHaveBeenCalled()
  })

  it('returns 404 when session missing', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ userId: '507f1f77bcf86cd799439011', roles: ['trust'] } as any)
    vi.mocked(resolveManualReview).mockResolvedValue(null)

    const request = new Request('https://tribalmingle.test/api/trust/liveness/session/token/review', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ resolution: 'approve' }),
    })

    const response = await manualReviewHandler(request, { params: Promise.resolve({ sessionToken: 'session-token-404' }) })
    expect(response.status).toBe(404)
  })

  it('rejects unauthenticated users', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null)

    const response = await manualReviewHandler(new Request('https://tribalmingle.test/api/trust/liveness/session/token/review', { method: 'POST' }), {
      params: Promise.resolve({ sessionToken: 'session-token-unauth' }),
    })

    expect(response.status).toBe(401)
  })
})
