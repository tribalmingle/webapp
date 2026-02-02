'use client'

import { useState } from 'react'

const initialState = { name: '', email: '', feedback: '' }

export default function FeedbackPage() {
  const [form, setForm] = useState(initialState)
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState<string>('')

  const handleChange = (field: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }))
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setStatus('submitting')
    setMessage('')

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      const data = await response.json()
      if (!response.ok || !data?.success) {
        throw new Error(data?.message || 'Unable to submit feedback.')
      }

      setStatus('success')
      setMessage('Thanks for your feedback. Our team has received it!')
      setForm(initialState)
    } catch (error) {
      setStatus('error')
      setMessage(error instanceof Error ? error.message : 'Unable to submit feedback.')
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <div className="rounded-3xl border border-neutral-200/60 bg-white/70 p-8 shadow-sm backdrop-blur dark:border-neutral-800/60 dark:bg-neutral-950/70">
        <div className="flex flex-col gap-3">
          <span className="inline-flex w-fit items-center rounded-full bg-purple-50 px-3 py-1 text-xs font-medium text-purple-700 dark:bg-purple-500/10 dark:text-purple-200">
            Feedback
          </span>
          <h1 className="text-3xl font-semibold tracking-tight">Tell us what you think</h1>
          <p className="text-base text-neutral-700 dark:text-neutral-300">
            Share your ideas, bugs, or suggestions. Your feedback goes straight to the TribalMingle admin team.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300" htmlFor="name">
              Name
            </label>
            <input
              id="name"
              type="text"
              value={form.name}
              onChange={handleChange('name')}
              className="w-full rounded-xl border border-neutral-200 bg-white/80 px-4 py-3 text-sm text-neutral-800 shadow-sm outline-none transition focus:border-purple-400 focus:ring-2 focus:ring-purple-200 dark:border-neutral-800 dark:bg-neutral-950/60 dark:text-neutral-100 dark:focus:border-purple-400"
              placeholder="Your name"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={form.email}
              onChange={handleChange('email')}
              className="w-full rounded-xl border border-neutral-200 bg-white/80 px-4 py-3 text-sm text-neutral-800 shadow-sm outline-none transition focus:border-purple-400 focus:ring-2 focus:ring-purple-200 dark:border-neutral-800 dark:bg-neutral-950/60 dark:text-neutral-100 dark:focus:border-purple-400"
              placeholder="you@email.com"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300" htmlFor="feedback">
              Feedback
            </label>
            <textarea
              id="feedback"
              value={form.feedback}
              onChange={handleChange('feedback')}
              className="min-h-[140px] w-full resize-none rounded-xl border border-neutral-200 bg-white/80 px-4 py-3 text-sm text-neutral-800 shadow-sm outline-none transition focus:border-purple-400 focus:ring-2 focus:ring-purple-200 dark:border-neutral-800 dark:bg-neutral-950/60 dark:text-neutral-100 dark:focus:border-purple-400"
              placeholder="Share your feedback"
              required
            />
          </div>

          {message && (
            <div
              className={`rounded-xl border px-4 py-3 text-sm ${
                status === 'success'
                  ? 'border-green-200 bg-green-50 text-green-800 dark:border-green-500/40 dark:bg-green-500/10 dark:text-green-200'
                  : 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-200'
              }`}
            >
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={status === 'submitting'}
            className="w-full rounded-xl bg-purple-600 px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {status === 'submitting' ? 'Sending…' : 'Send feedback'}
          </button>
        </form>
      </div>
    </main>
  )
}
