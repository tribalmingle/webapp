import { ObjectId } from 'mongodb'
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'

import { createReferralInvite, DuplicateReferralInviteError } from '@/lib/trust/referral-invite-service'
import { ensureReferralDocument } from '@/lib/trust/referral-progress-service'
import type { ReferralDocument } from '@/lib/data/types'

vi.mock('@/lib/trust/referral-progress-service', () => ({
  ensureReferralDocument: vi.fn(),
  buildReferralShareUrl: (code?: string | null) => (code ? `https://tribalmingle.test/r/${code}` : null),
}))

describe('referral invite service', () => {
  const mockCollection = {
    findOneAndUpdate: vi.fn(),
  }

  const baseDocument: ReferralDocument = {
    _id: new ObjectId('507f1f77bcf86cd799439012'),
    referrerUserId: new ObjectId('507f1f77bcf86cd799439011'),
    referralCode: 'shareme',
    sourceCampaign: undefined,
    bonusStatus: 'pending',
    tier: 'bronze',
    rolling90dCount: 0,
    invitees: [],
    payouts: [],
    metadata: undefined,
    lastRewardIssuedAt: undefined,
    createdAt: new Date('2025-01-01T00:00:00Z'),
    updatedAt: new Date('2025-01-01T00:00:00Z'),
  }

  beforeEach(() => {
    vi.mocked(ensureReferralDocument).mockResolvedValue({
      document: structuredClone(baseDocument),
      collection: mockCollection as any,
    })
    mockCollection.findOneAndUpdate.mockResolvedValue(structuredClone(baseDocument))
    mockCollection.findOneAndUpdate.mockClear()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('creates a referral invite and returns share url', async () => {
    const result = await createReferralInvite({
      referrerUserId: baseDocument.referrerUserId,
      inviteeEmail: 'friend@example.com',
      inviteeName: 'Friend',
      guardianEmail: 'guardian@example.com',
      channel: 'email',
      message: 'Join me on Tribal Mingle',
      locale: 'en',
      context: 'onboarding_card',
    }, { ip: '1.1.1.1', userAgent: 'jest' })

    expect(mockCollection.findOneAndUpdate).toHaveBeenCalled()
    const callArgs = mockCollection.findOneAndUpdate.mock.calls[0]
    expect(callArgs[1].$push.invitees.email).toBe('friend@example.com')
    expect(callArgs[1].$push.invitees.guardianEmail).toBe('guardian@example.com')

    expect(result.referralCode).toBe('shareme')
    expect(result.shareUrl).toBe('https://tribalmingle.test/r/shareme')
    expect(result.invite.email).toBe('friend@example.com')
  })

  it('prevents duplicate pending invites for same email', async () => {
    vi.mocked(ensureReferralDocument).mockResolvedValue({
      document: {
        ...structuredClone(baseDocument),
        invitees: [
          {
            email: 'friend@example.com',
            status: 'pending',
            invitedAt: new Date(),
            channel: 'email',
          },
        ],
      },
      collection: mockCollection as any,
    })

    await expect(
      createReferralInvite({ referrerUserId: baseDocument.referrerUserId, inviteeEmail: 'friend@example.com' }),
    ).rejects.toBeInstanceOf(DuplicateReferralInviteError)
  })
})
