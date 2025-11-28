'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  RefreshCw,
  ShieldCheck,
  LineChart,
  Target,
} from 'lucide-react'
import { ADMIN_COLORS } from '@/lib/constants/admin-theme'

interface SLOMeasurement {
  timestamp: string
  percentage: number
  metadata?: Record<string, any>
}

interface SLODefinition {
  id: string
  name: string
  description: string
  target: number
  window: string
}

interface SLOStatus {
  slo: SLODefinition
  current: number
  target: number
  errorBudget: number
  errorBudgetRemaining: number
  status: 'healthy' | 'warning' | 'critical'
  measurements?: SLOMeasurement[]
  lastUpdated: string | Date
}

const STATUS_COLORS: Record<SLOStatus['status'], string> = {
  healthy: 'border-gold-warm/50',
  warning: 'border-purple-royal-light/50',
  critical: 'border-destructive/50',
}

function formatPercent(value: number, decimals = 2) {
  return `${value.toFixed(decimals)}%`
}

function Sparkline({ points }: { points: number[] }) {
  if (!points.length) {
    return <div className="text-xs text-text-tertiary">No data</div>
  }

  const min = Math.min(...points)
  const max = Math.max(...points)
  const range = max - min || 1
  const normalized = points.map((value, index) => {
    const x = (index / (points.length - 1 || 1)) * 100
    const y = 100 - ((value - min) / range) * 100
    return `${x},${y}`
  })

  return (
    <svg viewBox="0 0 100 100" className="w-full h-12 text-indigo-600" preserveAspectRatio="none">
      <polyline
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        points={normalized.join(' ')}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  )
}

function getMeasurementSeries(slo: SLOStatus, length = 20): number[] {
  if (!slo.measurements || slo.measurements.length === 0) {
    return []
  }
  const recent = slo.measurements
    .map((measurement) => measurement.percentage ?? slo.current)
    .slice(0, length)
    .reverse()
  return recent
}

export default function SLOPage() {
  const [slos, setSLOs] = useState<SLOStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<string>('')

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 60000)
    return () => clearInterval(interval)
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/slo/status', { cache: 'no-store' })
      const data = await response.json()
      setSLOs(data.slos || [])
      setLastUpdated(data.timestamp || new Date().toISOString())
    } catch (error) {
      console.error('Failed to load SLO data:', error)
    } finally {
      setLoading(false)
    }
  }

  const summary = useMemo(() => {
    if (slos.length === 0) {
      return {
        overall: 100,
        healthy: 0,
        warning: 0,
        critical: 0,
        avgErrorBudget: 0,
        atRisk: [] as SLOStatus[],
        biggestMovers: [] as SLOStatus[],
      }
    }

    const overall = slos.reduce((sum, slo) => sum + slo.current, 0) / slos.length
    const healthy = slos.filter(s => s.status === 'healthy').length
    const warning = slos.filter(s => s.status === 'warning').length
    const critical = slos.filter(s => s.status === 'critical').length
    const avgErrorBudget =
      slos.reduce((sum, slo) => sum + slo.errorBudgetRemaining, 0) / slos.length
    const atRisk = slos
      .filter(s => s.status !== 'healthy')
      .sort((a, b) => a.current - b.current)
    const biggestMovers = [...slos]
      .sort((a, b) => a.errorBudgetRemaining - b.errorBudgetRemaining)
      .slice(0, 3)

    return {
      overall,
      healthy,
      warning,
      critical,
      avgErrorBudget,
      atRisk,
      biggestMovers,
    }
  }, [slos])

  const lastUpdatedLabel = lastUpdated
    ? new Date(lastUpdated).toLocaleString()
    : '---'

  return (
    <div className="container mx-auto p-6 space-y-8">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 font-semibold text-sm uppercase tracking-wide">
            <ShieldCheck className="w-5 h-5" />
            Reliability Center
          </div>
          <h1 className="text-3xl font-bold mt-2">Service Level Objectives</h1>
          <p className="text-text-secondary">Real-time health of critical platform commitments.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-sm text-text-tertiary flex items-center gap-1">
            <Clock className="w-4 h-4" />
            Updated {lastUpdatedLabel}
          </div>
          <button
            onClick={fetchData}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-border-gold/20 hover:bg-background-tertiary"
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </header>

      {/* Summary */}
      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="bg-background-secondary rounded-xl border border-border-gold/20 p-5">
          <div className="text-sm text-text-tertiary flex items-center gap-2">
            <Activity className="w-4 h-4 text-purple-royal" /> Overall Compliance
          </div>
          <div className="mt-2 text-3xl font-bold text-purple-royal">
            {formatPercent(summary.overall)}
          </div>
          <p className="text-xs text-text-tertiary mt-1">Across {slos.length} active SLOs</p>
        </div>
        <div className="bg-background-secondary rounded-xl border border-border-gold/20 p-5">
          <div className="text-sm text-text-tertiary flex items-center gap-2">
            <Target className="w-4 h-4 text-gold-warm" /> Meeting Targets
          </div>
          <div className="mt-2 text-3xl font-bold text-gold-warm">{summary.healthy}</div>
          <p className="text-xs text-text-tertiary mt-1">{summary.warning} warning • {summary.critical} critical</p>
        </div>
        <div className="bg-background-secondary rounded-xl border border-border-gold/20 p-5">
          <div className="text-sm text-text-tertiary flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-purple-royal-light" /> Error Budget Remaining
          </div>
          <div className="mt-2 text-3xl font-bold text-purple-royal-light">
            {formatPercent(Math.max(summary.avgErrorBudget, 0))}
          </div>
          <p className="text-xs text-text-tertiary mt-1">Average remaining across all SLOs</p>
        </div>
        <div className="bg-background-secondary rounded-xl border border-border-gold/20 p-5">
          <div className="text-sm text-text-tertiary flex items-center gap-2">
            <LineChart className="w-4 h-4 text-destructive" /> At Risk
          </div>
          <div className="mt-2 text-3xl font-bold text-destructive">{summary.atRisk.length}</div>
          <p className="text-xs text-text-tertiary mt-1">Need action to avoid breach</p>
        </div>
      </section>

      {!loading && slos.length === 0 && (
        <div className="bg-background-secondary border border-dashed border-border-gold/20 rounded-xl p-6 text-center text-text-tertiary">
          No SLO measurements have been recorded yet.
        </div>
      )}

      {/* At Risk Table */}
      <section className="bg-background-secondary rounded-xl border border-border-gold/20 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold flex items-center gap-2 text-purple-royal">
            <AlertTriangle className="w-5 h-5 text-purple-royal-light" /> At-Risk SLOs
          </h2>
          <span className="text-sm text-text-tertiary">Sorted by lowest performance</span>
        </div>
        {summary.atRisk.length === 0 ? (
          <div className="text-center py-8 text-text-tertiary">All SLOs are healthy 🎉</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-text-tertiary">
                <tr>
                  <th className="py-2 font-medium">SLO</th>
                  <th className="py-2 font-medium">Current</th>
                  <th className="py-2 font-medium">Target</th>
                  <th className="py-2 font-medium">Error Budget</th>
                  <th className="py-2 font-medium">Window</th>
                  <th className="py-2 font-medium">Trend</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {summary.atRisk.map((slo) => {
                  const series = getMeasurementSeries(slo, 12)
                  const trend = series.length > 1
                    ? series[series.length - 1] - series[0]
                    : 0
                  return (
                    <tr key={slo.slo.id}>
                      <td className="py-3">
                        <div className="font-medium">{slo.slo.name}</div>
                        <div className="text-xs text-text-tertiary">{slo.slo.description}</div>
                      </td>
                      <td className="py-3 font-semibold text-text-primary">{formatPercent(slo.current)}</td>
                      <td className="py-3 text-text-secondary">{formatPercent(slo.target, 1)}</td>
                      <td className="py-3 text-text-secondary">{formatPercent(slo.errorBudgetRemaining, 3)}</td>
                      <td className="py-3 text-text-secondary capitalize">{slo.slo.window}</td>
                      <td className="py-3">
                        <div className="flex items-center gap-1 text-xs text-text-secondary">
                          {trend >= 0 ? (
                            <ArrowUpRight className="w-4 h-4 text-green-500" />
                          ) : (
                            <ArrowDownRight className="w-4 h-4 text-red-500" />
                          )}
                          {formatPercent(Math.abs(trend || 0), 2)}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Detailed Cards */}
      <section className="grid gap-4 md:grid-cols-2">
        {slos.map((slo) => (
          <div key={slo.slo.id} className={`rounded-xl border p-6 bg-background-secondary border-l-4 ${STATUS_COLORS[slo.status]}`}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-text-primary">{slo.slo.name}</h3>
                <p className="text-sm text-text-secondary">{slo.slo.description}</p>
              </div>
              <span className={`text-sm font-semibold capitalize ${slo.status === 'healthy' ? 'text-gold-warm' : slo.status === 'warning' ? 'text-purple-royal-light' : 'text-destructive'}`}>{slo.status}</span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-text-tertiary">Current</div>
                <div className="text-2xl font-bold text-text-primary">{formatPercent(slo.current)}</div>
                <p className="text-xs text-text-tertiary">Target {formatPercent(slo.target)}</p>
              </div>
              <div>
                <div className="text-text-tertiary">Error Budget Remaining</div>
                <div className="text-2xl font-bold text-text-primary">{formatPercent(Math.max(slo.errorBudgetRemaining, 0), 3)}</div>
                <p className="text-xs text-text-tertiary">Budget {formatPercent(slo.errorBudget, 3)}</p>
              </div>
            </div>
            <div className="mt-4">
              <div className="flex justify-between text-xs text-text-secondary mb-1">
                <span>Performance</span>
                <span>{formatPercent(slo.current)} / {formatPercent(slo.target)}</span>
              </div>
              <div className="w-full bg-background-tertiary rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${
                    slo.status === 'healthy'
                      ? 'bg-gold-gradient'
                      : slo.status === 'warning'
                      ? 'bg-purple-royal-light'
                      : 'bg-destructive'
                  }`}
                  style={{ width: `${Math.min(slo.current, 100)}%` }}
                />
              </div>
            </div>
            <div className="mt-4">
              <Sparkline points={getMeasurementSeries(slo, 20)} />
              <p className="text-xs text-text-tertiary text-right">Last 20 measurements</p>
            </div>
          </div>
        ))}
      </section>
    </div>
  )
}

