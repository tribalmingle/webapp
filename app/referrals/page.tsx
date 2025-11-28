'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/auth-context'
import { MemberAppShell } from '@/components/layouts/member-app-shell'
import { Gift, Users, Share2, Check, Copy } from 'lucide-react'

interface ReferralTierInfo {
  key: string
  label: string
  minSuccessful: number
  memberReward: string
  guardianReward?: string
}

interface ReferralProgressData {
  referralCode: string | null
  shareUrl: string | null
  tier: ReferralTierInfo
  tiers: Array<ReferralTierInfo & { attained: boolean }>
  nextTier: (ReferralTierInfo & { remaining: number }) | null
  counts: {
    totalInvitees: number
    pending: number
    successful: number
    rewarded: number
    rolling90dCount: number
  }
  rollingWindow: {
    days: number
    start: string | null
  }
  rewards: {
    memberReward: string
    payoutsIssued: number
    lastRewardIssuedAt: string | null
  }
}

export default function ReferralsPage() {
  const { user } = useAuth()
  const [referralProgress, setReferralProgress] = useState<ReferralProgressData | null>(null)
  const [referralLoading, setReferralLoading] = useState(false)
  const [referralError, setReferralError] = useState<string | null>(null)
  const [referralCopiedField, setReferralCopiedField] = useState<'code' | 'link' | null>(null)
  const [showReferralInvite, setShowReferralInvite] = useState(false)

  useEffect(() => {
    loadReferralProgress()
  }, [])

  const loadReferralProgress = async () => {
    setReferralLoading(true)
    setReferralError(null)
    try {
      const res = await fetch('/api/referrals/progress')
      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: res.statusText }))
        throw new Error(errData.error || 'Failed to load referral data')
      }
      const data: ReferralProgressData = await res.json()
      setReferralProgress(data)
    } catch (err: any) {
      setReferralError(err.message)
    } finally {
      setReferralLoading(false)
    }
  }

  const copyReferralValue = (val: string | null, field: 'code' | 'link') => {
    if (!val) return
    navigator.clipboard.writeText(val)
    setReferralCopiedField(field)
    setTimeout(() => setReferralCopiedField(null), 2000)
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const counts = referralProgress?.counts
  const tiers = referralProgress?.tiers ?? []
  const nextTier = referralProgress?.nextTier ?? null
  const rollingWindowDays = referralProgress?.rollingWindow.days ?? 90
  const rollingWindowStart = referralProgress?.rollingWindow.start
  const rollingWindowLabel = rollingWindowStart
    ? `Rolling ${rollingWindowDays}-day window since ${new Date(rollingWindowStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
    : `Rolling ${rollingWindowDays}-day window`

  const tierStats = [
    { label: 'Pending invites', value: counts?.pending ?? 0 },
    { label: 'Successful', value: counts?.successful ?? 0 },
    { label: 'Rewarded', value: counts?.rewarded ?? 0 },
    { label: 'Total sent', value: counts?.totalInvitees ?? 0 },
  ]

  return (
    <MemberAppShell title="Referrals" description="Grow the tribe, unlock rewards">
      <div className="max-w-7xl mx-auto">
        <section className="rounded-2xl border border-emerald-100 bg-white/80 p-5 md:p-6 shadow-sm dark:border-emerald-500/20 dark:bg-slate-900/50">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">Referral tiers</p>
              <h2 className="text-xl md:text-2xl font-semibold text-slate-900 dark:text-white">Grow the tribe, unlock rewards</h2>
              <p className="text-sm text-slate-600 dark:text-slate-300">{rollingWindowLabel}. Earn better rewards as more of your invites join.</p>
            </div>
            <div className="text-left sm:text-right">
              <p className="text-xs uppercase text-slate-500">Successful invites ({rollingWindowDays}d)</p>
              <p className="text-3xl font-semibold text-slate-900 dark:text-white">{counts ? counts.rolling90dCount : referralLoading ? '…' : '—'}</p>
              <button
                type="button"
                onClick={loadReferralProgress}
                className="mt-1 text-xs font-medium text-emerald-600 hover:text-emerald-700"
              >
                Refresh progress
              </button>
            </div>
          </div>

          {referralError && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-200">
              {referralError}
            </div>
          )}

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <div className="space-y-4">
              <div className="rounded-xl border border-slate-200/80 bg-white/90 p-4 dark:border-slate-800 dark:bg-slate-900/60">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Your referral code</p>
                    <p className="text-2xl font-mono font-bold text-slate-900 dark:text-white tracking-wide">
                      {referralProgress?.referralCode ?? (referralLoading ? 'Generating…' : '—')}
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="w-full sm:w-auto"
                    disabled={!referralProgress?.referralCode}
                    onClick={() => copyReferralValue(referralProgress?.referralCode ?? null, 'code')}
                  >
                    {referralCopiedField === 'code' ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
                    {referralCopiedField === 'code' ? 'Copied' : 'Copy code'}
                  </Button>
                </div>
                <div className="mt-4 space-y-2">
                  <div className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-slate-50/70 p-3 text-sm dark:border-slate-700 dark:bg-slate-900">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold text-slate-800 dark:text-slate-100">Share link</p>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={!referralProgress?.shareUrl}
                        onClick={() => copyReferralValue(referralProgress?.shareUrl ?? null, 'link')}
                        className="h-8 text-xs"
                      >
                        {referralCopiedField === 'link' ? <Check className="mr-2 h-4 w-4" /> : <Share2 className="mr-2 h-4 w-4" />}
                        {referralCopiedField === 'link' ? 'Link copied' : 'Copy link'}
                      </Button>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 break-all">
                      {referralProgress?.shareUrl ?? 'Share link will appear once your referral code finishes provisioning.'}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" onClick={() => setShowReferralInvite(true)}>
                      <Gift className="mr-2 h-4 w-4" /> Invite from contacts
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        if (!referralProgress?.shareUrl) return
                        if (typeof window !== 'undefined') {
                          window.open(referralProgress.shareUrl, '_blank')
                        }
                      }}
                      disabled={!referralProgress?.shareUrl}
                    >
                      <Users className="mr-2 h-4 w-4" /> Preview landing page
                    </Button>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200/80 bg-white/90 p-4 dark:border-slate-800 dark:bg-slate-900/60">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Invite status</p>
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  {tierStats.map((stat) => (
                    <div key={stat.label} className="rounded-lg border border-slate-100 bg-slate-50/70 px-3 py-2 text-slate-700 dark:border-slate-700 dark:bg-slate-950/40 dark:text-slate-200">
                      <p className="text-xs uppercase tracking-wide text-slate-500">{stat.label}</p>
                      <p className="text-xl font-semibold text-slate-900 dark:text-white">{stat.value}</p>
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-xs text-slate-500">Rolling count resets automatically; keep momentum within the current window.</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-xl border border-slate-200/80 bg-white/90 p-4 dark:border-slate-800 dark:bg-slate-900/60">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-slate-800 dark:text-slate-100">Tier ladder</span>
                  {referralLoading && <span className="text-xs text-slate-500">Refreshing…</span>}
                </div>
                <ul className="mt-4 space-y-3">
                  {tiers.length ? (
                    tiers.map((tier) => (
                      <li
                        key={tier.key}
                        className={`rounded-lg border px-3 py-3 text-sm ${tier.attained ? 'border-emerald-200 bg-emerald-50/70 dark:border-emerald-500/30 dark:bg-emerald-500/10' : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-950/40'}`}
                      >
                        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="font-semibold text-slate-900 dark:text-white">{tier.label}</p>
                            <p className="text-xs text-slate-500">Requires {tier.minSuccessful} successful invites</p>
                          </div>
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${tier.attained ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}>
                            {tier.attained ? 'Unlocked' : 'Locked'}
                          </span>
                        </div>
                        <p className="mt-2 text-xs text-slate-600 dark:text-slate-300">Reward: {tier.memberReward}</p>
                        {tier.guardianReward && (
                          <p className="text-xs text-slate-500 dark:text-slate-400">Guardian perk: {tier.guardianReward}</p>
                        )}
                      </li>
                    ))
                  ) : (
                    <li className="rounded-lg border border-dashed border-slate-300 px-3 py-3 text-sm text-slate-500">Invite friends to reveal tier progress.</li>
                  )}
                </ul>
              </div>

              <div className="rounded-xl border border-slate-200/80 bg-linear-to-b from-white to-emerald-50/70 p-4 dark:border-slate-800 dark:from-slate-900 dark:to-slate-900/60">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Next milestone</p>
                {nextTier ? (
                  <>
                    <h3 className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">{nextTier.label} tier</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-300">Invite {nextTier.remaining} more successful member{nextTier.remaining === 1 ? '' : 's'} to unlock.</p>
                    <p className="mt-2 text-xs text-slate-500">Member reward: {nextTier.memberReward}</p>
                    {nextTier.guardianReward && (
                      <p className="text-xs text-slate-500">Guardian perk: {nextTier.guardianReward}</p>
                    )}
                  </>
                ) : (
                  <>
                    <h3 className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">You are at the top tier</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-300">Our team will reach out when we launch new referral milestones. Keep inviting to earn bonuses.</p>
                  </>
                )}
                <div className="mt-4 rounded-lg border border-emerald-200 bg-white/80 px-3 py-2 text-xs text-slate-600 dark:border-emerald-500/30 dark:bg-slate-900/60 dark:text-slate-300">
                  <p className="font-semibold text-slate-700 dark:text-slate-200">Recent rewards</p>
                  <p>Reward issued: {referralProgress?.rewards.memberReward ?? 'Pending'}</p>
                  <p>Payouts issued: {referralProgress?.rewards.payoutsIssued ?? 0}</p>
                  <p>Last reward: {referralProgress?.rewards.lastRewardIssuedAt ? formatDate(referralProgress.rewards.lastRewardIssuedAt) : 'Not yet awarded'}</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </MemberAppShell>
  )
}
    </FeatureGate>
  )
}
