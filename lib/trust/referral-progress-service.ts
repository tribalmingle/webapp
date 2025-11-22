import crypto from 'node:crypto'
import { ObjectId, type Collection } from 'mongodb'

import type { ReferralDocument } from '@/lib/data/types'
import { getMongoDb } from '@/lib/mongodb'

const COLLECTION_NAME = 'referrals'
const ROLLING_WINDOW_DAYS = Number(process.env.REFERRAL_ROLLING_WINDOW_DAYS ?? 90)
const SHARE_BASE_URL = (process.env.REFERRAL_SHARE_BASE_URL || 'https://tribalmingle.test/r').replace(/\/$/, '')

export type ReferralTierKey = 'bronze' | 'silver' | 'gold'

export type ReferralTierConfig = {
  key: ReferralTierKey
  label: string
  minSuccessful: number
  memberReward: string
  guardianReward?: string
}

export const REFERRAL_TIERS: ReferralTierConfig[] = [
  {
    key: 'bronze',
    label: 'Bronze',
    minSuccessful: 0,
    memberReward: '+1 boost credit per successful invite',
    guardianReward: 'Priority guardian invite review (optional)',
  },
  {
    key: 'silver',
    label: 'Silver',
    minSuccessful: 2,
    memberReward: '1 month premium light or 5 boost credits',
    guardianReward: 'Concierge family portal call',
  },
  {
    key: 'gold',
    label: 'Gold',
    minSuccessful: 5,
    memberReward: 'Cash-equivalent payout or annual premium',
    guardianReward: 'Optional guardian stipend',
  },
]

const SUCCESS_STATUSES: Array<ReferralDocument['invitees'][number]['status']> = ['joined', 'rewarded']
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const DEFAULT_CODE_LENGTH = Number(process.env.REFERRAL_CODE_LENGTH ?? 8)

export async function ensureReferralDocument(userId: string | ObjectId) {
  const referrerUserId = toObjectId(userId)
  const db = await getMongoDb()
  const collection = db.collection<ReferralDocument>(COLLECTION_NAME)
  const document = await findOrCreateReferralDocument(collection, referrerUserId)
  return { document, collection }
}

export function buildReferralShareUrl(referralCode?: string | null) {
  if (!referralCode) {
    return null
  }
  return `${SHARE_BASE_URL}/${referralCode}`
}

export type ReferralProgress = {
  referralCode: string | null
  shareUrl: string | null
  tier: ReferralTierConfig
  tiers: Array<ReferralTierConfig & { attained: boolean }>
  nextTier: (ReferralTierConfig & { remaining: number }) | null
  counts: {
    totalInvitees: number
    pending: number
    successful: number
    rewarded: number
    rolling90dCount: number
  }
  rollingWindowStart: Date
  rollingWindowDays: number
  payoutsIssued: number
  lastRewardIssuedAt?: Date
}

export async function getReferralProgress(userId: string | ObjectId): Promise<ReferralProgress> {
  const referrerUserId = toObjectId(userId)
  const db = await getMongoDb()
  const collection = db.collection<ReferralDocument>(COLLECTION_NAME)

  const document = await findOrCreateReferralDocument(collection, referrerUserId)

  const { counts, rollingWindowStart } = summarizeInvitees(document)
  const tier = resolveTier(counts.rolling90dCount)
  const nextTier = findNextTier(counts.rolling90dCount)

  if (shouldPersistProgress(document, tier.key, counts.rolling90dCount)) {
    const filter = document._id ? { _id: document._id } : { referrerUserId }
    await collection.updateOne(
      filter,
      {
        $set: {
          tier: tier.key,
          rolling90dCount: counts.rolling90dCount,
          updatedAt: new Date(),
        },
      },
    )
  }

  return {
    referralCode: document.referralCode ?? null,
    shareUrl: buildReferralShareUrl(document.referralCode),
    tier,
    tiers: REFERRAL_TIERS.map((config) => ({ ...config, attained: counts.rolling90dCount >= config.minSuccessful })),
    nextTier: nextTier
      ? {
          ...nextTier,
          remaining: Math.max(0, nextTier.minSuccessful - counts.rolling90dCount),
        }
      : null,
    counts,
    rollingWindowStart,
    rollingWindowDays: ROLLING_WINDOW_DAYS,
    payoutsIssued: document.payouts?.length ?? 0,
    lastRewardIssuedAt: document.lastRewardIssuedAt ?? document.payouts?.at(-1)?.issuedAt,
  }
}

async function findOrCreateReferralDocument(collection: Collection<ReferralDocument>, referrerUserId: ObjectId) {
  const existing = await collection.findOne({ referrerUserId })
  if (existing) {
    return existing
  }
  return createReferralDocument(collection, referrerUserId)
}

async function createReferralDocument(collection: Collection<ReferralDocument>, referrerUserId: ObjectId) {
  const now = new Date()
  const referralCode = await generateUniqueReferralCode(collection)

  const document: ReferralDocument = {
    _id: new ObjectId(),
    referrerUserId,
    referralCode,
    sourceCampaign: undefined,
    bonusStatus: 'pending',
    tier: 'bronze',
    rolling90dCount: 0,
    invitees: [],
    payouts: [],
    metadata: undefined,
    lastRewardIssuedAt: undefined,
    createdAt: now,
    updatedAt: now,
  }

  await collection.insertOne(document)
  return document
}

function summarizeInvitees(document: ReferralDocument) {
  const invitees = document.invitees ?? []
  const windowStart = new Date(Date.now() - ROLLING_WINDOW_DAYS * 24 * 60 * 60 * 1000)

  const counts = invitees.reduce<ReferralProgress['counts']>(
    (acc, invitee) => {
      acc.totalInvitees += 1
      if (invitee.status === 'pending') {
        acc.pending += 1
      }
      if (SUCCESS_STATUSES.includes(invitee.status)) {
        acc.successful += 1
        if (invitee.status === 'rewarded') {
          acc.rewarded += 1
        }
        const milestoneDate = invitee.joinedAt ?? invitee.invitedAt
        if (milestoneDate && milestoneDate >= windowStart) {
          acc.rolling90dCount += 1
        }
      }
      return acc
    },
    {
      totalInvitees: 0,
      pending: 0,
      successful: 0,
      rewarded: 0,
      rolling90dCount: 0,
    },
  )

  return { counts, rollingWindowStart: windowStart }
}

function resolveTier(successfulReferrals: number) {
  return REFERRAL_TIERS.reduce((current, candidate) => {
    if (successfulReferrals >= candidate.minSuccessful && candidate.minSuccessful >= current.minSuccessful) {
      return candidate
    }
    return current
  }, REFERRAL_TIERS[0])
}

function findNextTier(successfulReferrals: number) {
  return REFERRAL_TIERS.find((tier) => tier.minSuccessful > successfulReferrals) ?? null
}

function shouldPersistProgress(document: ReferralDocument, tierKey: ReferralTierKey, rollingCount: number) {
  return (document.tier ?? 'bronze') !== tierKey || (document.rolling90dCount ?? 0) !== rollingCount
}

async function generateUniqueReferralCode(collection: Collection<ReferralDocument>) {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const code = generateReferralCode(DEFAULT_CODE_LENGTH)
    const existing = await collection.findOne({ referralCode: code }, { projection: { _id: 1 } })
    if (!existing) {
      return code
    }
  }
  throw new Error('Unable to allocate referral code after multiple attempts')
}

function generateReferralCode(length: number) {
  const bytes = crypto.randomBytes(length)
  let result = ''
  for (let i = 0; i < length; i += 1) {
    const index = bytes[i] % CODE_ALPHABET.length
    result += CODE_ALPHABET[index]
  }
  return result.toLowerCase()
}

function toObjectId(value: string | ObjectId) {
  if (value instanceof ObjectId) {
    return value
  }
  return new ObjectId(value)
}
