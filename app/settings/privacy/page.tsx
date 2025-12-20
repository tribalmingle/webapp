import React from 'react'
import { getCurrentUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export default async function PrivacySettingsPage() {
  const user = await getCurrentUser()
  if (!user) return <div className='p-6'>Please sign in</div>
  return (
    <div className='max-w-xl mx-auto p-6 space-y-6'>
      <h1 className='text-2xl font-semibold'>Privacy</h1>
      <p className='text-sm text-neutral-600 dark:text-neutral-400'>Stub controls (Phase 7): implement persistence + enforcement later.</p>
      <form className='space-y-4'>
        <fieldset className='space-y-2'>
          <label className='block text-sm font-medium'>Profile Visibility</label>
          <select className='w-full rounded border px-3 py-2 text-sm'>
            <option value='public'>Public</option>
            <option value='members'>Members only</option>
            <option value='hidden'>Hidden</option>
          </select>
        </fieldset>
        <fieldset className='space-y-2'>
          <label className='flex items-center gap-3 text-sm'>
            <input type='checkbox' /> Hide Age
          </label>
          <label className='flex items-center gap-3 text-sm'>
            <input type='checkbox' /> Hide Distance
          </label>
          <label className='flex items-center gap-3 text-sm'>
            <input type='checkbox' /> Incognito Mode
          </label>
        </fieldset>
        <button type='button' className='rounded bg-indigo-600 px-4 py-2 text-sm text-white'>Save (stub)</button>
      </form>
    </div>
  )
}
