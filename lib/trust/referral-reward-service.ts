import { ObjectId } from 'mongodb'

import { trackServerEvent } from '@/lib/analytics/segment'
import { grantReferralBoostCredits } from '@/lib/boost/credit-ledger-service'
import type { ReferralDocument } from '@/lib/data/types'
import { ensureReferralDocument, getReferralProgress, type ReferralTierKey } from '@/lib/trust/referral-progress-service'

const TIER_REWARD_CREDITS: Partial<Record<ReferralTierKey, number>> = {
  silver: 5,
  gold: 20,
}

const TIER_ORDER: Record<ReferralTierKey, number> = {
  bronze: 0,
  silver: 1,
  gold: 2,
}

export async function issueReferralTierReward(userId: string | ObjectId) {
  const { document, collection } = await ensureReferralDocument(userId)
  const progress = await getReferralProgress(userId)
  const currentTier = progress.tier.key
  const rewardCredits = TIER_REWARD_CREDITS[currentTier]

  if (!rewardCredits) {
    return { rewarded: false as const }
  }

  const lastRewardedTier = getLastRewardedTier(document)
  if (!isHigherTier(currentTier, lastRewardedTier)) {
    return { rewarded: false as const }
  }

  await grantReferralBoostCredits({
    userId,
    amount: rewardCredits,
    reason: `referral_${currentTier}_reward`,
  })

  const now = new Date()
  const metadata = updateMetadata(document.metadata, currentTier, rewardCredits, now)
  const filter = document._id ? { _id: document._id } : { referrerUserId: document.referrerUserId }

  await collection.updateOne(filter, {
    $set: {
      metadata,
      lastRewardIssuedAt: now,
      updatedAt: now,
    },
  })

  await trackServerEvent({
    userId: document.referrerUserId.toString(),
    event: 'referral.reward.issued',
    properties: {
      tier: currentTier,
      credits: rewardCredits,
      referralCode: progress.referralCode,
    },
  })

  return { rewarded: true as const, tier: currentTier, credits: rewardCredits }
}

function getLastRewardedTier(document: ReferralDocument): ReferralTierKey {
  const stored = document.metadata?.lastRewardedTier
  if (stored === 'silver' || stored === 'gold') {
    return stored
  }
  return 'bronze'
}

function isHigherTier(next: ReferralTierKey, current: ReferralTierKey) {
  return TIER_ORDER[next] > TIER_ORDER[current]
}

function updateMetadata(
  metadata: ReferralDocument['metadata'],
  tier: ReferralTierKey,
  credits: number,
  issuedAt: Date,
) {
  const history = Array.isArray((metadata as any)?.rewardHistory) ? ([...(metadata as any).rewardHistory] as any[]) : []
  history.push({ tier, issuedAt, reward: { type: 'boost_credit', credits } })

  return {
    ...(metadata ?? {}),
    lastRewardedTier: tier,
    rewardHistory: history,
  }
}
