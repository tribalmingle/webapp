import React from 'react'
import { getCurrentUser } from '@/lib/auth'

export default async function AccountManagementPage() {
  const user = await getCurrentUser()
  if (!user) return <div className='p-6'>Please sign in</div>
  return (
    <div className='max-w-xl mx-auto p-6 space-y-6'>
      <h1 className='text-2xl font-semibold'>Account Management</h1>
      <p className='text-sm text-neutral-600 dark:text-neutral-400'>Verification, deletion, and data export (Phase 7 stub).</p>
      <div className='space-y-4'>
        <div className='border rounded p-4 space-y-2'>
          <h2 className='font-medium'>Verification Status</h2>
          <ul className='text-xs list-disc pl-4'>
            <li>Selfie: pending</li>
            <li>ID: pending</li>
            <li>Social: pending</li>
            <li>Background: pending</li>
          </ul>
          <button className='mt-2 rounded bg-indigo-600 px-3 py-1 text-xs text-white'>Begin Verification (stub)</button>
        </div>
        <div className='border rounded p-4 space-y-2'>
          <h2 className='font-medium'>Data Export</h2>
          <p className='text-xs'>Request your profile & interaction archive (GDPR compliant).</p>
          <button className='rounded bg-neutral-700 px-3 py-1 text-xs text-white'>Request Export (stub)</button>
        </div>
        <div className='border rounded p-4 space-y-2'>
          <h2 className='font-medium text-red-600'>Delete Account</h2>
          <p className='text-xs text-neutral-600 dark:text-neutral-400'>Schedules deletion with 30-day grace period.</p>
          <button className='rounded bg-red-600 px-3 py-1 text-xs text-white'>Schedule Deletion (stub)</button>
        </div>
      </div>
    </div>
  )
}
