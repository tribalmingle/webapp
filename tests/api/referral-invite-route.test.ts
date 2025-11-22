import { describe, expect, it, vi } from 'vitest'

import { POST as referralInviteHandler } from '@/app/api/referrals/invite/route'
import { getCurrentUser } from '@/lib/auth'
import { createReferralInvite } from '@/lib/trust/referral-invite-service'

vi.mock('@/lib/auth', () => ({
  getCurrentUser: vi.fn(),
}))

class MockDuplicateError extends Error {}

vi.mock('@/lib/trust/referral-invite-service', () => ({
  createReferralInvite: vi.fn(),
  DuplicateReferralInviteError: class extends Error {},
}))

describe('referral invite API', () => {
  it('requires authentication', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null)

    const response = await referralInviteHandler(new Request('http://localhost/api/referrals/invite', {
      method: 'POST',
      body: JSON.stringify({ inviteeEmail: 'friend@example.com' }),
    }))

    expect(response.status).toBe(401)
  })

  it('returns validation errors for malformed payloads', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ userId: 'user', email: 'member@example.com' } as any)

    const response = await referralInviteHandler(new Request('http://localhost/api/referrals/invite', {
      method: 'POST',
      body: JSON.stringify({ inviteeEmail: 'not-an-email' }),
    }))

    expect(response.status).toBe(400)
  })

  it('creates referral invite and returns invite payload', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ userId: 'user', email: 'member@example.com' } as any)
    vi.mocked(createReferralInvite).mockResolvedValue({
      referralCode: 'shareme',
      shareUrl: 'https://tribalmingle.test/r/shareme',
      invite: {
        email: 'friend@example.com',
        guardianEmail: 'guardian@example.com',
        channel: 'email',
        invitedAt: new Date('2024-12-01T00:00:00Z'),
        status: 'pending',
      },
    })

    const response = await referralInviteHandler(new Request('http://localhost/api/referrals/invite', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ inviteeEmail: 'friend@example.com', guardianEmail: 'guardian@example.com' }),
    }))

    const payload = await response.json()
    expect(response.status).toBe(200)
    expect(payload.success).toBe(true)
    expect(payload.invite.email).toBe('friend@example.com')
    expect(createReferralInvite).toHaveBeenCalledWith(expect.objectContaining({ inviteeEmail: 'friend@example.com' }), expect.any(Object))
  })
})
