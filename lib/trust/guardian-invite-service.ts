import { ObjectId } from 'mongodb'

import type { GuardianInviteRequestDocument } from '@/lib/data/types'
import { getMongoDb } from '@/lib/mongodb'

const COLLECTION_NAME = 'guardian_invite_requests'

type CreateGuardianInviteRequestInput = {
  memberName: string
  contact: string
  locale: string
  context?: string
  regionHint?: string
  source?: GuardianInviteRequestDocument['source']
  metadata?: GuardianInviteRequestDocument['metadata']
}

type RequestDiagnostics = {
  ip?: string
  userAgent?: string
}

export async function createGuardianInviteRequest(input: CreateGuardianInviteRequestInput, diagnostics: RequestDiagnostics = {}) {
  const db = await getMongoDb()
  const now = new Date()

  const document: GuardianInviteRequestDocument = {
    _id: new ObjectId(),
    memberName: input.memberName,
    contact: input.contact,
    locale: input.locale,
    context: input.context,
    regionHint: input.regionHint,
    source: input.source ?? 'family_portal_form',
    status: 'received',
    metadata: mergeMetadata(input.metadata, diagnostics),
    createdAt: now,
    updatedAt: now,
  }

  await db.collection<GuardianInviteRequestDocument>(COLLECTION_NAME).insertOne(document)

  return document
}

function mergeMetadata(metadata: GuardianInviteRequestDocument['metadata'] | undefined, diagnostics: RequestDiagnostics) {
  if (!metadata && !diagnostics.ip && !diagnostics.userAgent) {
    return undefined
  }

  return {
    ...metadata,
    ip: diagnostics.ip || metadata?.ip,
    userAgent: diagnostics.userAgent || metadata?.userAgent,
  }
}
