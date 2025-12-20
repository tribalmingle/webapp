'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function SpotlightRedirect() {
  const router = useRouter()
  
  useEffect(() => {
    router.replace('/dashboard-spa?view=spotlight')
  }, [router])
  
  return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-muted-foreground">Redirecting to spotlight...</p>
    </div>
  )
}

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/auth-context'
import { MemberAppShell } from '@/components/layouts/member-app-shell'
import { Zap } from 'lucide-react'

type BoostPlacement = 'spotlight' | 'travel' | 'event'
type BoostLocale = 'africa_west' | 'africa_east' | 'diaspora_eu' | 'diaspora_na'

interface BoostBidRecord {
  sessionId: string
  status: string
  bidAmountCredits: number
  auctionWindowStart: string | null
  boostStartsAt: string | null
  boostEndsAt: string | null
  autoRollover: boolean
  createdAt: string | null
  updatedAt: string | null
}

interface BoostSummary {
  success: boolean
  window: {
    locale: string
    placement: string
    windowStart: string
    boostStartsAt: string
    boostEndsAt: string
    minBidCredits: number
    maxWinners: number
  }
  nextWindow: {
    windowStart: string
    boostStartsAt: string
    boostEndsAt: string
  }
  credits: {
    available: number
    minBidCredits: number
  }
  bids: {
    pending: BoostBidRecord | null
    nextPending: BoostBidRecord | null
    active: BoostBidRecord[]
    history: BoostBidRecord[]
  }
}

const BOOST_LOCALE_OPTIONS: { value: BoostLocale; label: string }[] = [
  { value: 'africa_west', label: 'West Africa' },
  { value: 'africa_east', label: 'East Africa' },
  { value: 'diaspora_eu', label: 'Europe Diaspora' },
  { value: 'diaspora_na', label: 'North America Diaspora' },
]

const BOOST_PLACEMENT_OPTIONS: { value: BoostPlacement; label: string }[] = [
  { value: 'spotlight', label: 'Spotlight' },
  { value: 'travel', label: 'Travel' },
  { value: 'event', label: 'Event' },
]

export default function SpotlightPage() {
  const { user } = useAuth()
  const [boostSummary, setBoostSummary] = useState<BoostSummary | null>(null)
  const [boostLoading, setBoostLoading] = useState(false)
  const [boostError, setBoostError] = useState<string | null>(null)
  const [boostLocale, setBoostLocale] = useState<BoostLocale>('africa_west')
  const [boostPlacement, setBoostPlacement] = useState<BoostPlacement>('spotlight')
  const [boostBidAmount, setBoostBidAmount] = useState<number | ''>('')
  const [boostAutoRollover, setBoostAutoRollover] = useState(false)
  const [boostBidSubmitting, setBoostBidSubmitting] = useState(false)

  useEffect(() => {
    loadBoostSummary()
  }, [boostLocale, boostPlacement])

  const loadBoostSummary = async () => {
    setBoostLoading(true)
    setBoostError(null)
    try {
      const res = await fetch(`/api/boost/summary?locale=${boostLocale}&placement=${boostPlacement}`)
      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: res.statusText }))
        throw new Error(errData.error || 'Failed to load boost data')
      }
      const data: BoostSummary = await res.json()
      setBoostSummary(data)
    } catch (err: any) {
      setBoostError(err.message)
    } finally {
      setBoostLoading(false)
    }
  }

  const handleBoostBidSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!boostBidAmount) return
    
    setBoostBidSubmitting(true)
    try {
      const res = await fetch('/api/boost/bid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          locale: boostLocale,
          placement: boostPlacement,
          bidAmountCredits: boostBidAmount,
          autoRollover: boostAutoRollover,
        }),
      })
      
      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: res.statusText }))
        throw new Error(errData.error || 'Failed to place bid')
      }
      
      await loadBoostSummary()
      setBoostBidAmount('')
      setBoostAutoRollover(false)
    } catch (err: any) {
      setBoostError(err.message)
    } finally {
      setBoostBidSubmitting(false)
    }
  }

  const formatBoostDateTime = (dateStr: string | null) => {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
  }

  const safeFormatTime = (dateStr: string | null) => {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  }

  const getBoostStatusColor = (status: string) => {
    switch (status) {
      case 'won':
      case 'active':
        return 'text-emerald-600'
      case 'lost':
        return 'text-red-600'
      case 'pending':
        return 'text-amber-600'
      default:
        return 'text-slate-600'
    }
  }

  const bids = boostSummary?.bids

  return (
    <MemberAppShell title="Spotlight Boost" description="Jump to the top of discovery">
      <div className="max-w-7xl mx-auto">
        <section className="rounded-2xl border border-border/60 bg-white/70 p-5 md:p-6 shadow-sm dark:bg-slate-900/40 dark:border-slate-800">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-600">Boost spotlight</p>
              <h2 className="text-xl md:text-2xl font-semibold text-slate-900 dark:text-white">Jump to the top of discovery</h2>
              <p className="text-sm text-slate-600 dark:text-slate-300">Bid credits to claim the next spotlight slot in your region.</p>
            </div>
            <div className="text-left sm:text-right">
              <p className="text-xs uppercase text-slate-500">Credits available</p>
              <p className="text-3xl font-semibold text-slate-900 dark:text-white">
                {boostSummary ? boostSummary.credits.available : '—'}
              </p>
              <button
                type="button"
                onClick={loadBoostSummary}
                className="mt-1 text-sm font-medium text-amber-600 hover:text-amber-700"
              >
                Refresh status
              </button>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-4">
            <label className="flex flex-col text-sm font-medium text-slate-700 dark:text-slate-200">
              Locale
              <select
                value={boostLocale}
                onChange={(event) => setBoostLocale(event.target.value as BoostLocale)}
                className="mt-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-amber-500 dark:border-slate-700 dark:bg-slate-950"
              >
                {BOOST_LOCALE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col text-sm font-medium text-slate-700 dark:text-slate-200">
              Placement
              <select
                value={boostPlacement}
                onChange={(event) => setBoostPlacement(event.target.value as BoostPlacement)}
                className="mt-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-amber-500 dark:border-slate-700 dark:bg-slate-950"
              >
                {BOOST_PLACEMENT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            {boostLoading && <span className="self-end text-xs text-slate-500">Refreshing window data…</span>}
          </div>

          {boostError && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-200">
              {boostError}
            </div>
          )}

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <div className="space-y-4">
              <div className="rounded-xl border border-slate-200/80 bg-white/80 p-4 dark:border-slate-800 dark:bg-slate-900/60">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-slate-800 dark:text-slate-100">Current window</span>
                  <span className="text-slate-500">Min {boostSummary?.window.minBidCredits ?? '—'} credits</span>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  {boostSummary
                    ? (
                        <>
                          Boost runs {formatBoostDateTime(boostSummary.window.boostStartsAt)} → {safeFormatTime(boostSummary.window.boostEndsAt)}
                        </>
                      )
                    : 'Window timing details load as soon as the auction settings are ready.'}
                </p>
                {bids?.pending ? (
                  <div className="mt-3 rounded-lg border border-amber-100 bg-amber-50/80 px-3 py-2 text-sm text-amber-900 dark:border-amber-400/40 dark:bg-amber-500/10 dark:text-amber-200">
                    <p className="font-semibold">{bids.pending.bidAmountCredits} credits locked in</p>
                    <p className="text-xs">{bids.pending.autoRollover ? 'Auto-rollover is on' : 'Single window bid'}</p>
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-slate-500">You have not placed a bid for this window yet.</p>
                )}
                {bids?.nextPending && (
                  <div className="mt-3 rounded-lg border border-indigo-100 bg-indigo-50/80 px-3 py-2 text-sm text-indigo-900 dark:border-indigo-400/40 dark:bg-indigo-500/10 dark:text-indigo-200">
                    <p className="font-semibold">Next window bid: {bids.nextPending.bidAmountCredits} credits</p>
                    <p className="text-xs">Bidding for {formatBoostDateTime(bids.nextPending.boostStartsAt)}</p>
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-slate-200/80 bg-white/80 p-4 dark:border-slate-800 dark:bg-slate-900/60">
                <div className="flex items-center justify-between text-sm font-semibold">
                  <span className="text-slate-800 dark:text-slate-100">Active boosts</span>
                  <span className="text-slate-500">{bids?.active.length ?? 0}</span>
                </div>
                <ul className="mt-3 space-y-2 text-sm">
                  {bids?.active.length ? (
                    bids.active.map((bid) => (
                      <li key={bid.sessionId} className="rounded-lg border border-emerald-100 bg-emerald-50/70 px-3 py-2 dark:border-emerald-400/30 dark:bg-emerald-500/10">
                        <p className="flex items-center justify-between text-sm font-semibold text-emerald-900 dark:text-emerald-200">
                          {bid.bidAmountCredits} credits
                          <span className="text-xs italic">Ends {safeFormatTime(bid.boostEndsAt)}</span>
                        </p>
                        <p className="text-xs text-emerald-800 dark:text-emerald-200/80">Started {formatBoostDateTime(bid.boostStartsAt)}</p>
                      </li>
                    ))
                  ) : (
                    <li className="text-sm text-slate-500">No boosts running right now.</li>
                  )}
                </ul>
              </div>

              <div className="rounded-xl border border-slate-200/80 bg-white/80 p-4 dark:border-slate-800 dark:bg-slate-900/60">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Recent bid history</p>
                <ul className="mt-3 space-y-2 text-sm">
                  {bids?.history.length ? (
                    bids.history.slice(0, 4).map((bid) => (
                      <li key={bid.sessionId} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-slate-800 dark:text-slate-200">{bid.bidAmountCredits} credits</p>
                          <p className="text-xs text-slate-500">{formatBoostDateTime(bid.boostStartsAt)}</p>
                        </div>
                        <span className={`text-xs font-semibold ${getBoostStatusColor(bid.status)}`}>{bid.status}</span>
                      </li>
                    ))
                  ) : (
                    <li className="text-sm text-slate-500">No bids yet. Your history will appear here after your first auction.</li>
                  )}
                </ul>
              </div>
            </div>

            <form onSubmit={handleBoostBidSubmit} className="rounded-2xl border border-slate-200/80 bg-linear-to-b from-white to-amber-50/60 p-5 dark:border-slate-800 dark:from-slate-900 dark:to-slate-900/60">
              <p className="text-lg font-semibold text-slate-900 dark:text-white">Place a bid</p>
              <p className="text-sm text-slate-500">Top {boostSummary?.window.maxWinners ?? 0} bidders secure the spotlight.</p>

              <label className="mt-6 block text-sm font-medium text-slate-700 dark:text-slate-200">
                Bid amount (credits)
                <input
                  type="number"
                  min={boostSummary?.credits.minBidCredits ?? 1}
                  value={boostBidAmount}
                  onChange={(event) => setBoostBidAmount(event.target.value ? Number(event.target.value) : '')}
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-lg font-semibold text-slate-900 shadow-sm outline-none focus:border-amber-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
                <span className="mt-1 block text-xs text-slate-500">Minimum {boostSummary?.credits.minBidCredits ?? 0} credits</span>
              </label>

              <label className="mt-4 flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
                <input
                  type="checkbox"
                  checked={boostAutoRollover}
                  onChange={(event) => setBoostAutoRollover(event.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                />
                Auto-rollover losing bids into the next window
              </label>

              <button
                type="submit"
                disabled={!boostBidAmount || boostBidSubmitting}
                className="mt-6 w-full rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-3 font-semibold text-white shadow-lg transition-all hover:from-amber-600 hover:to-amber-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {boostBidSubmitting ? 'Placing bid...' : 'Submit bid'}
              </button>
            </form>
          </div>
        </section>
      </div>
    </MemberAppShell>
  )
}
