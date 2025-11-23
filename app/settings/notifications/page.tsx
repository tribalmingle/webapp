import React from 'react'
import { getCurrentUser } from '@/lib/auth'

export default async function NotificationSettingsPage() {
  const user = await getCurrentUser()
  if (!user) return <div className='p-6'>Please sign in</div>
  return (
    <div className='max-w-xl mx-auto p-6 space-y-6'>
      <h1 className='text-2xl font-semibold'>Notifications</h1>
      <p className='text-sm text-neutral-600 dark:text-neutral-400'>Configure channels & quiet hours (Phase 7 stub).</p>
      <form className='space-y-4'>
        <label className='flex items-center gap-3 text-sm'><input type='checkbox' defaultChecked /> Email Alerts</label>
        <label className='flex items-center gap-3 text-sm'><input type='checkbox' defaultChecked /> Push Notifications</label>
        <label className='flex items-center gap-3 text-sm'><input type='checkbox' /> SMS (Guardian Escalations)</label>
        <div className='space-y-2'>
          <label className='block text-sm font-medium'>Quiet Hours</label>
          <div className='flex gap-2'>
            <input type='time' className='rounded border px-2 py-1 text-sm' defaultValue='22:00' />
            <span className='text-sm'>to</span>
            <input type='time' className='rounded border px-2 py-1 text-sm' defaultValue='06:00' />
          </div>
        </div>
        <button type='button' className='rounded bg-indigo-600 px-4 py-2 text-sm text-white'>Save (stub)</button>
      </form>
    </div>
  )
}
