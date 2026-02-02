'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, CheckCircle2, Inbox } from 'lucide-react'

interface FeedbackItem {
  id: string
  name: string
  email: string
  feedback: string
  status: string
  createdAt?: string
  readAt?: string
}

export default function AdminFeedbackPage() {
  const router = useRouter()
  const [items, setItems] = useState<FeedbackItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadFeedback = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/admin/feedback')
      const data = await response.json()
      if (!response.ok || !data?.success) {
        throw new Error(data?.message || 'Failed to load feedback')
      }
      setItems(data.feedback || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load feedback')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadFeedback()
  }, [])

  const markRead = async (id: string) => {
    try {
      await fetch(`/api/admin/feedback/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'read' }),
      })
      setItems((prev) => prev.map((item) => (item.id === id ? { ...item, status: 'read', readAt: new Date().toISOString() } : item)))
    } catch (err) {
      console.error('Failed to mark feedback as read', err)
    }
  }

  return (
    <div className="min-h-screen bg-background-primary px-6 py-10">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <button
              className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary"
              onClick={() => router.push('/admin/overview')}
            >
              <ArrowLeft className="h-4 w-4" />
              Back to overview
            </button>
            <h1 className="mt-3 text-2xl font-semibold text-text-primary">Feedback Inbox</h1>
            <p className="text-sm text-text-secondary">Member feedback submitted from the public form.</p>
          </div>
          <button
            onClick={loadFeedback}
            className="rounded-xl border border-border-gold/30 bg-background-secondary px-4 py-2 text-sm font-medium text-text-primary shadow-sm"
          >
            Refresh
          </button>
        </div>

        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="rounded-2xl border border-border-gold/20 bg-background-secondary p-10 text-center text-sm text-text-secondary">
            Loading feedback...
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border-gold/30 bg-background-secondary p-10 text-center text-sm text-text-secondary">
            <Inbox className="mx-auto mb-3 h-6 w-6 text-text-tertiary" />
            No feedback yet.
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((item) => (
              <div key={item.id} className="rounded-2xl border border-border-gold/20 bg-background-secondary p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-text-primary">{item.name}</p>
                    <p className="text-sm text-text-secondary">{item.email}</p>
                    <p className="mt-3 text-sm text-text-primary whitespace-pre-line">{item.feedback}</p>
                  </div>
                  <div className="text-right text-xs text-text-tertiary">
                    <p>{item.createdAt ? new Date(item.createdAt).toLocaleString() : '—'}</p>
                    <p className={`mt-2 inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-semibold ${item.status === 'read' ? 'bg-green-500/10 text-green-200' : 'bg-amber-500/10 text-amber-200'}`}>
                      {item.status === 'read' ? 'Read' : 'New'}
                    </p>
                    {item.status !== 'read' && (
                      <button
                        className="mt-3 inline-flex items-center gap-1 rounded-full bg-green-600/20 px-3 py-1 text-[11px] font-semibold text-green-100"
                        onClick={() => markRead(item.id)}
                      >
                        <CheckCircle2 className="h-3 w-3" />
                        Mark read
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
