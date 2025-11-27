import React from 'react'
import { getCurrentUser } from '@/lib/auth'
import { generateOrGetExistingCode, getReferralProgress } from '@/lib/services/referral-service'
import { useFeatureFlag } from '@/lib/hooks/use-feature-flag'

function FeatureGate({ children }: { children: React.ReactNode }) {
  'use client'
  const referralsEnabled = useFeatureFlag('referrals-v1')
  
  if (!referralsEnabled) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <h1>Referral Program</h1>
        <p>The referral program is currently in beta and not available for your account.</p>
        <p>Check back soon to invite friends and earn rewards!</p>
      </div>
    )
  }
  
  return <>{children}</>
}

export default async function ReferralPage() {
  const user = await getCurrentUser()
  if (!user) return <div className='p-6'>Please sign in</div>
  const codeRec = await generateOrGetExistingCode(user.userId)
  const progress = await getReferralProgress(user.userId)
  const shareUrl = `https://tribalmingle.com/signup?ref=${codeRec.code}`
  return (
    <FeatureGate>
      <div className='max-w-xl mx-auto p-6 space-y-6'>
        <h1 className='text-2xl font-semibold'>Referrals</h1>
        <p className='text-sm text-neutral-600 dark:text-neutral-400'>Invite friends and earn rewards (stub logic).</p>
        <div className='border rounded p-4 space-y-2'>
          <p className='text-sm font-medium'>Your Code</p>
          <code className='block rounded bg-neutral-900/80 text-neutral-100 px-3 py-2 text-sm'>{codeRec.code}</code>
          <p className='text-xs'>Share link:</p>
          <input readOnly value={shareUrl} className='w-full rounded border px-2 py-1 text-xs' />
        </div>
        <div className='border rounded p-4 space-y-2'>
          <p className='text-sm font-medium'>Progress</p>
          <ul className='text-xs list-disc pl-4'>
            <li>Clicks: {progress.stats.clicks}</li>
            <li>Signups: {progress.stats.signups}</li>
            <li>Verified: {progress.stats.verified}</li>
            <li>Rewards Credited: {progress.stats.rewards}</li>
          </ul>
        </div>
        <p className='text-xs text-neutral-500'>Fraud detection + reward distribution pending (Phase 7).</p>
      </div>
    </FeatureGate>
  )
}
