import { ObjectId } from 'mongodb'

import type { ReferralDocument } from '@/lib/data/types'
import { ensureReferralDocument, buildReferralShareUrl } from '@/lib/trust/referral-progress-service'

export type ReferralInviteChannel = ReferralDocument['invitees'][number]['channel']

type CreateReferralInviteInput = {
  referrerUserId: string | ObjectId
  inviteeEmail: string
  inviteeName?: string
  guardianEmail?: string
  channel?: ReferralInviteChannel
  message?: string
  locale?: string
  context?: string
}

type ReferralInviteDiagnostics = {
  ip?: string
  userAgent?: string
}

export class DuplicateReferralInviteError extends Error {
  constructor(message = 'Invite already pending for this contact') {
    super(message)
    this.name = 'DuplicateReferralInviteError'
  }
}

export async function createReferralInvite(input: CreateReferralInviteInput, diagnostics: ReferralInviteDiagnostics = {}) {
  const { document, collection } = await ensureReferralDocument(input.referrerUserId)
  const normalizedEmail = normalizeEmail(input.inviteeEmail)
  const guardianEmail = input.guardianEmail ? normalizeEmail(input.guardianEmail) : undefined

  if (!normalizedEmail) {
    throw new Error('Invitee email is required')
  }

  const duplicateInvite = document.invitees?.some(
    (invitee) => invitee.email?.toLowerCase() === normalizedEmail && invitee.status === 'pending',
  )

  if (duplicateInvite) {
    throw new DuplicateReferralInviteError()
  }

  const now = new Date()
  const channel: ReferralInviteChannel = input.channel ?? 'email'

  const inviteRecord: ReferralDocument['invitees'][number] = {
    email: normalizedEmail,
    guardianEmail,
    name: valueOrUndefined(input.inviteeName),
    channel,
    status: 'pending',
    invitedAt: now,
    message: valueOrUndefined(input.message),
    metadata: buildMetadata(input, diagnostics),
  }

  const updatedDocument = await collection.findOneAndUpdate(
    { _id: document._id },
    {
      $push: { invitees: inviteRecord },
      $set: { updatedAt: now },
    },
    { returnDocument: 'after' },
  )

  const referralCode = updatedDocument?.referralCode ?? document.referralCode ?? null

  return {
    invite: inviteRecord,
    referralCode,
    shareUrl: buildReferralShareUrl(referralCode),
  }
}

function normalizeEmail(value?: string | null) {
  if (!value) return undefined
  return value.trim().toLowerCase()
}

function valueOrUndefined(value?: string | null) {
  if (!value) return undefined
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

function buildMetadata(input: CreateReferralInviteInput, diagnostics: ReferralInviteDiagnostics) {
  const metadata: Record<string, unknown> = {}

  if (input.locale) {
    metadata.locale = input.locale
  }
  if (input.context) {
    metadata.context = input.context
  }
  if (diagnostics.ip) {
    metadata.ip = diagnostics.ip
  }
  if (diagnostics.userAgent) {
    metadata.userAgent = diagnostics.userAgent
  }

  return Object.keys(metadata).length > 0 ? metadata : undefined
}
