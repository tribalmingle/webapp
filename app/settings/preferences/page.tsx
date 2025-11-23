import React from 'react'
import { getCurrentUser } from '@/lib/auth'

export default async function PreferencesSettingsPage() {
  const user = await getCurrentUser()
  if (!user) return <div className='p-6'>Please sign in</div>
  return (
    <div className='max-w-xl mx-auto p-6 space-y-6'>
      <h1 className='text-2xl font-semibold'>App Preferences</h1>
      <p className='text-sm text-neutral-600 dark:text-neutral-400'>Choose locale, theme, and units (stub).</p>
      <form className='space-y-4'>
        <div>
          <label className='block text-sm font-medium'>Language / Locale</label>
          <select className='mt-1 w-full rounded border px-3 py-2 text-sm'>
            <option value='en'>English</option>
            <option value='fr'>Français</option>
            <option value='ar'>العربية</option>
          </select>
        </div>
        <div>
          <label className='block text-sm font-medium'>Theme</label>
          <select className='mt-1 w-full rounded border px-3 py-2 text-sm'>
            <option value='system'>System</option>
            <option value='light'>Light</option>
            <option value='dark'>Dark</option>
          </select>
        </div>
        <div>
          <label className='block text-sm font-medium'>Distance Units</label>
          <select className='mt-1 w-full rounded border px-3 py-2 text-sm'>
            <option value='km'>Kilometers</option>
            <option value='mi'>Miles</option>
          </select>
        </div>
        <button type='button' className='rounded bg-indigo-600 px-4 py-2 text-sm text-white'>Save (stub)</button>
      </form>
    </div>
  )
}
