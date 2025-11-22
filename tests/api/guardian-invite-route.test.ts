import { ObjectId } from 'mongodb'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { POST } from '@/app/api/guardian-invites/request/route'
import { trackServerEvent } from '@/lib/analytics/segment'
import { createGuardianInviteRequest } from '@/lib/trust/guardian-invite-service'

vi.mock('@/lib/trust/guardian-invite-service', () => ({
  createGuardianInviteRequest: vi.fn(),
}))

vi.mock('@/lib/analytics/segment', () => ({
  trackServerEvent: vi.fn(),
}))

beforeEach(() => {
  vi.clearAllMocks()
})

describe('POST /api/guardian-invites/request', () => {
  it('persists invite and responds with success payload', async () => {
    const now = new Date()
    const insertedId = new ObjectId()

    vi.mocked(createGuardianInviteRequest).mockResolvedValue({
      _id: insertedId,
      memberName: 'Ama',
      contact: 'ama@example.com',
      locale: 'fr',
      status: 'received',
      source: 'family_portal_form',
      createdAt: now,
      updatedAt: now,
    } as any)

    const request = new Request('https://tribalmingle.test/api/guardian-invites/request', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-vercel-ip-country': 'GH',
      },
      body: JSON.stringify({
        memberName: ' Ama ',
        contact: ' ama@example.com ',
        locale: 'fr',
        context: 'Guardian wants read-only access',
      }),
    })

    const response = await POST(request)

    expect(response.status).toBe(200)
    const payload = await response.json()
    expect(payload.success).toBe(true)
    expect(payload.requestId).toBe(insertedId.toString())

    expect(createGuardianInviteRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        memberName: 'Ama',
        contact: 'ama@example.com',
        locale: 'fr',
        regionHint: 'GH',
      }),
      expect.objectContaining({ ip: undefined, userAgent: undefined }),
    )

    expect(trackServerEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        event: 'family-portal.invite.submit',
        properties: expect.objectContaining({ requestId: insertedId.toString(), locale: 'fr', channel: 'email' }),
      }),
    )
  })

  it('rejects invalid payloads with 400', async () => {
    const request = new Request('https://tribalmingle.test/api/guardian-invites/request', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ memberName: 'A', contact: '' }),
    })

    const response = await POST(request)
    expect(response.status).toBe(400)
    const payload = await response.json()
    expect(payload.success).toBe(false)
    expect(payload.errors?.memberName).toBeDefined()
    expect(payload.errors?.contact).toBeDefined()
    expect(createGuardianInviteRequest).not.toHaveBeenCalled()
  })

  it('defaults locale when unsupported and handles form submissions', async () => {
    const insertedId = new ObjectId()
    const now = new Date()
    vi.mocked(createGuardianInviteRequest).mockResolvedValue({
      _id: insertedId,
      memberName: 'Kojo',
      contact: '+15551234567',
      locale: 'en',
      status: 'received',
      source: 'family_portal_form',
      createdAt: now,
      updatedAt: now,
    } as any)

    const form = new URLSearchParams()
    form.set('memberName', 'Kojo')
    form.set('contact', '+15551234567')
    form.set('locale', 'xx')

    const request = new Request('https://tribalmingle.test/api/guardian-invites/request', {
      method: 'POST',
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
        'x-forwarded-for': '203.0.113.10',
      },
      body: form.toString(),
    })

    const response = await POST(request)
    expect(response.status).toBe(200)

    expect(createGuardianInviteRequest).toHaveBeenCalledWith(
      expect.objectContaining({ locale: 'en' }),
      expect.objectContaining({ ip: '203.0.113.10' }),
    )
  })
})
