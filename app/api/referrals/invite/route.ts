import { NextResponse } from 'next/server'
import { z } from 'zod'

import { getCurrentUser } from '@/lib/auth'
import { trackServerEvent } from '@/lib/analytics/segment'
import { createReferralInvite, DuplicateReferralInviteError } from '@/lib/trust/referral-invite-service'

const invitePayloadSchema = z.object({
  inviteeEmail: z.string().trim().email(),
  inviteeName: z.string().trim().min(2).max(140).optional(),
  guardianEmail: z.string().trim().email().optional(),
  channel: z.enum(['email', 'whatsapp', 'share_link']).default('email'),
  message: z.string().trim().max(500).optional(),
  locale: z.string().trim().max(16).optional(),
  context: z.string().trim().max(200).optional(),
})

type Diagnostics = {
  ip?: string
  userAgent?: string
}

export async function POST(request: Request) {
  const authUser = await getCurrentUser()

  if (!authUser) {
    return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 })
  }

  const payload = await safeJson(request)
  const validation = invitePayloadSchema.safeParse(payload)

  if (!validation.success) {
    return NextResponse.json({ success: false, errors: validation.error.flatten().fieldErrors }, { status: 400 })
  }

  const diagnostics: Diagnostics = {
    ip: extractClientIp(request.headers),
    userAgent: request.headers.get('user-agent') ?? undefined,
  }

  try {
    const result = await createReferralInvite({
      referrerUserId: authUser.userId,
      ...validation.data,
    }, diagnostics)

    await trackServerEvent({
      userId: authUser.userId,
      event: 'referral.invite.sent',
      properties: {
        referralCode: result.referralCode,
        channel: validation.data.channel,
        guardianEmailProvided: Boolean(validation.data.guardianEmail),
        locale: validation.data.locale,
        context: validation.data.context,
      },
    })

    return NextResponse.json({
      success: true,
      referralCode: result.referralCode,
      shareUrl: result.shareUrl,
      invite: {
        email: result.invite.email,
        guardianEmail: result.invite.guardianEmail ?? null,
        channel: result.invite.channel,
        invitedAt: result.invite.invitedAt.toISOString(),
        status: result.invite.status,
      },
    })
  } catch (error) {
    if (error instanceof DuplicateReferralInviteError) {
      return NextResponse.json({ success: false, error: 'Invite already pending for this contact' }, { status: 409 })
    }

    console.error('[referrals] invite creation failed', error)
    return NextResponse.json({ success: false, error: 'Unable to send invite' }, { status: 500 })
  }
}

async function safeJson(request: Request) {
  try {
    return await request.json()
  } catch (error) {
    return {}
  }
}

function extractClientIp(headers: Headers) {
  const forwarded = headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0]?.trim()
  }
  return headers.get('x-real-ip') ?? undefined
}
