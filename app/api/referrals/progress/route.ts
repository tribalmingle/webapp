import { NextResponse } from 'next/server'

import { getCurrentUser } from '@/lib/auth'
import { getReferralProgress } from '@/lib/trust/referral-progress-service'
import { issueReferralTierReward } from '@/lib/trust/referral-reward-service'

export async function GET() {
  const authUser = await getCurrentUser()

  if (!authUser) {
    return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 })
  }

  try {
    await issueReferralTierReward(authUser.userId)
    const progress = await getReferralProgress(authUser.userId)

    return NextResponse.json({
      success: true,
      referralCode: progress.referralCode,
      shareUrl: progress.shareUrl,
      tier: formatTier(progress.tier),
      tiers: progress.tiers.map((tier) => ({ ...formatTier(tier), attained: tier.attained })),
      nextTier: progress.nextTier ? { ...formatTier(progress.nextTier), remaining: progress.nextTier.remaining } : null,
      counts: progress.counts,
      rollingWindow: {
        start: progress.rollingWindowStart.toISOString(),
        days: progress.rollingWindowDays,
      },
      rewards: {
        memberReward: progress.tier.memberReward,
        guardianReward: progress.tier.guardianReward ?? null,
        payoutsIssued: progress.payoutsIssued,
        lastRewardIssuedAt: progress.lastRewardIssuedAt ? progress.lastRewardIssuedAt.toISOString() : null,
      },
    })
  } catch (error) {
    console.error('[referrals] Failed to fetch progress', error)
    return NextResponse.json({ success: false, error: 'Unable to load referral progress' }, { status: 500 })
  }
}

function formatTier<T extends { key: string; label: string; minSuccessful: number; memberReward: string; guardianReward?: string | undefined }>(tier: T) {
  return {
    key: tier.key,
    label: tier.label,
    minSuccessful: tier.minSuccessful,
    memberReward: tier.memberReward,
    guardianReward: tier.guardianReward ?? null,
  }
}
