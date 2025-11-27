'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Cpu,
  Database,
  Gauge,
  Loader2,
  RefreshCw,
  Server,
  TrendingDown,
  TrendingUp,
} from 'lucide-react'

interface WebVitalMetric {
  metric: 'LCP' | 'FID' | 'CLS' | 'TTFB'
  p75: number
  unit: string
  status: 'good' | 'needs_improvement' | 'poor'
  target: number
  trend: number[]
}

interface BackendMetric {
  name: string
  description: string
  value: number
  unit: string
  target: number
  status: 'healthy' | 'warning' | 'critical'
  change: number
}

interface SlowQueryMetric {
  namespace: string
  operation: string
  p95: number
  avg: number
  max: number
  sampleQuery?: string
  lastSeen: string
}

interface ResourceUsageMetric {
  service: string
  cpu: number
  memory: number
  instances: number
  requestsPerMinute: number
  errorRate: number
}

interface PerformanceMetricsResponse {
  metrics: {
    vitals: WebVitalMetric[]
    backend: BackendMetric[]
    slowQueries: SlowQueryMetric[]
    resources: ResourceUsageMetric[]
    generatedAt: string
  }
  generatedAt: string
}

const vitalDescriptions: Record<WebVitalMetric['metric'], string> = {
  LCP: 'Largest Contentful Paint',
  FID: 'First Input Delay',
  CLS: 'Cumulative Layout Shift',
  TTFB: 'Time to First Byte',
}

const vitalTargets: Record<WebVitalMetric['metric'], string> = {
  LCP: '< 2.5s',
  FID: '< 100ms',
  CLS: '< 0.1',
  TTFB: '< 300ms',
}

function VitalStatusBadge({ status }: { status: WebVitalMetric['status'] }) {
  const map = {
    good: 'bg-green-100 text-green-700 border border-green-200',
    needs_improvement: 'bg-yellow-100 text-yellow-700 border border-yellow-200',
    poor: 'bg-red-100 text-red-700 border border-red-200',
  }
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${map[status]}`}>
      {status.replace('_', ' ')}
    </span>
  )
}

function ProgressBar({ value, target }: { value: number; target: number }) {
  if (value <= 0 || target <= 0) {
    return <div className="w-full bg-gray-200 rounded-full h-2" />
  }
  const ratio = value <= target ? 1 : target / value
  const percent = Math.min(ratio * 100, 100)
  return (
    <div className="w-full bg-gray-200 rounded-full h-2">
      <div
        className="bg-indigo-600 h-2 rounded-full"
        style={{ width: `${percent}%` }}
      />
    </div>
  )
}

export default function PerformanceDashboard() {
  const [data, setData] = useState<PerformanceMetricsResponse['metrics'] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch('/api/admin/system/performance', { cache: 'no-store' })
      if (!response.ok) throw new Error('Failed to load performance metrics')
      const json: PerformanceMetricsResponse = await response.json()
      setData(json.metrics)
    } catch (err) {
      console.error(err)
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
    const interval = setInterval(loadData, 60000)
    return () => clearInterval(interval)
  }, [])

  const summary = useMemo(() => {
    if (!data) {
      return {
        vitalsPassing: 0,
        backendWarnings: 0,
        avgCpu: 0,
        avgErrorRate: 0,
      }
    }
    const vitalsPassing = data.vitals.filter(v => v.status === 'good').length
    const backendWarnings = data.backend.filter(m => m.status !== 'healthy').length
    const avgCpu = data.resources.length
      ? data.resources.reduce((sum, r) => sum + r.cpu, 0) / data.resources.length
      : 0
    const avgErrorRate = data.resources.length
      ? data.resources.reduce((sum, r) => sum + r.errorRate, 0) / data.resources.length
      : 0
    return { vitalsPassing, backendWarnings, avgCpu, avgErrorRate }
  }, [data])

  return (
    <div className="container mx-auto p-6 space-y-8">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 uppercase tracking-wide text-xs font-semibold">
            <Gauge className="w-4 h-4" /> Performance Command Center
          </div>
          <h1 className="text-3xl font-bold mt-2">Platform Performance</h1>
          <p className="text-gray-600">Web vitals, backend latency, and infrastructure health in one view.</p>
        </div>
        <div className="flex items-center gap-3">
          {data && (
            <div className="text-xs text-gray-500 flex items-center gap-1">
              <Activity className="w-4 h-4" /> Updated {new Date(data.generatedAt).toLocaleString()}
            </div>
          )}
          <button
            onClick={loadData}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-gray-300 hover:bg-gray-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            Refresh
          </button>
        </div>
      </header>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white rounded-xl border p-5 shadow-sm">
          <div className="text-sm text-gray-500 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-green-500" /> Web Vitals Passing
          </div>
          <div className="mt-2 text-3xl font-bold text-green-600">{summary.vitalsPassing}/4</div>
          <p className="text-xs text-gray-500 mt-1">Meeting Core Web Vital targets</p>
        </div>
        <div className="bg-white rounded-xl border p-5 shadow-sm">
          <div className="text-sm text-gray-500 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" /> Backend Alerts
          </div>
          <div className="mt-2 text-3xl font-bold text-amber-600">{summary.backendWarnings}</div>
          <p className="text-xs text-gray-500 mt-1">Services above their latency/error thresholds</p>
        </div>
        <div className="bg-white rounded-xl border p-5 shadow-sm">
          <div className="text-sm text-gray-500 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-indigo-500" /> Average CPU Utilization
          </div>
          <div className="mt-2 text-3xl font-bold text-indigo-600">{summary.avgCpu.toFixed(1)}%</div>
          <p className="text-xs text-gray-500 mt-1">Across all production services</p>
        </div>
        <div className="bg-white rounded-xl border p-5 shadow-sm">
          <div className="text-sm text-gray-500 flex items-center gap-2">
            <Server className="w-4 h-4 text-red-500" /> Mean Error Rate
          </div>
          <div className="mt-2 text-3xl font-bold text-red-600">{summary.avgErrorRate.toFixed(2)}%</div>
          <p className="text-xs text-gray-500 mt-1">Requests resulting in 4xx/5xx</p>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="bg-white rounded-xl border shadow-sm">
          <div className="p-6 border-b flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Gauge className="w-5 h-5 text-indigo-600" /> Core Web Vitals
              </h2>
              <p className="text-sm text-gray-500">User-centric metrics collected from field data</p>
            </div>
          </div>
          <div className="divide-y">
            {data?.vitals.map((vital) => {
              const hasTrendData = Array.isArray(vital.trend) && vital.trend.length >= 2
              const improving = hasTrendData && vital.trend[0] > vital.trend[vital.trend.length - 1]
              return (
                <div key={vital.metric} className="p-6 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-lg font-semibold">{vitalDescriptions[vital.metric]}</div>
                    <p className="text-sm text-gray-500">Target {vitalTargets[vital.metric]}</p>
                  </div>
                  <VitalStatusBadge status={vital.status} />
                </div>
                <div className="grid md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="text-gray-500">p75</div>
                    <div className="text-2xl font-bold">
                      {vital.unit === 'ms' ? `${Math.round(vital.p75)}ms` : vital.p75.toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500">Trend</div>
                    <div className="flex items-center gap-1 font-semibold">
                        {!hasTrendData && <Activity className="w-4 h-4 text-gray-400" />}
                        {hasTrendData && improving && <TrendingUp className="w-4 h-4 text-green-500" />}
                        {hasTrendData && !improving && <TrendingDown className="w-4 h-4 text-red-500" />}
                        {hasTrendData ? `${vital.trend.length} samples` : 'Stable'}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500">Progress</div>
                    <ProgressBar value={vital.p75} target={vital.target} />
                  </div>
                </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="bg-white rounded-xl border shadow-sm">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Database className="w-5 h-5 text-indigo-600" /> Backend & Slow Queries
            </h2>
            <p className="text-sm text-gray-500">Top backend services and MongoDB hotspots</p>
          </div>
          <div className="divide-y">
            <div className="p-6 space-y-4">
              {data?.backend.map((metric) => (
                <div key={metric.name} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <div className="font-semibold">{metric.name}</div>
                      <p className="text-xs text-gray-500">{metric.description}</p>
                    </div>
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        metric.status === 'healthy'
                          ? 'bg-green-100 text-green-700'
                          : metric.status === 'warning'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {metric.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <div className="text-gray-500">Latency</div>
                      <div className="text-xl font-bold">{metric.value}{metric.unit}</div>
                    </div>
                    <div>
                      <div className="text-gray-500">Target</div>
                      <div className="text-xl font-bold">{metric.target}{metric.unit}</div>
                    </div>
                    <div>
                      <div className="text-gray-500">Change</div>
                      <div className={`text-xl font-bold ${metric.change < 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {metric.change > 0 ? '+' : ''}{metric.change.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-6">
              <h3 className="font-semibold mb-3">Slow Queries</h3>
              <div className="space-y-3">
                {data?.slowQueries.map((query) => (
                  <div key={`${query.namespace}-${query.operation}`} className="border rounded-lg p-3 bg-gray-50">
                    <div className="flex items-center justify-between text-sm">
                      <div className="font-semibold">{query.namespace}.{query.operation}</div>
                      <span className="text-xs text-gray-500">
                        Last seen {new Date(query.lastSeen).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-xs text-gray-600 mt-2">
                      <div>P95: {query.p95}ms</div>
                      <div>Avg: {query.avg}ms</div>
                      <div>Max: {query.max}ms</div>
                    </div>
                    {query.sampleQuery && (
                      <pre className="mt-2 text-xs bg-white border rounded p-2 overflow-x-auto">
                        {query.sampleQuery}
                      </pre>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white rounded-xl border shadow-sm">
        <div className="p-6 border-b flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Server className="w-5 h-5 text-indigo-600" /> Infrastructure Utilization
            </h2>
            <p className="text-sm text-gray-500">CPU, memory, and traffic per service</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="text-left px-6 py-3 font-medium">Service</th>
                <th className="text-left px-6 py-3 font-medium">CPU</th>
                <th className="text-left px-6 py-3 font-medium">Memory</th>
                <th className="text-left px-6 py-3 font-medium">Instances</th>
                <th className="text-left px-6 py-3 font-medium">Req/min</th>
                <th className="text-left px-6 py-3 font-medium">Error Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {data?.resources?.map((resource) => (
                <tr key={resource.service}>
                  <td className="px-6 py-4 font-semibold text-gray-900">{resource.service}</td>
                  <td className="px-6 py-4">{resource.cpu}%</td>
                  <td className="px-6 py-4">{resource.memory}%</td>
                  <td className="px-6 py-4">{resource.instances}</td>
                  <td className="px-6 py-4">{resource.requestsPerMinute.toLocaleString()}</td>
                  <td className="px-6 py-4">{resource.errorRate.toFixed(2)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
          {(!data || data.resources.length === 0) && (
            <div className="text-center py-6 text-gray-500">No resource metrics available.</div>
          )}
        </div>
      </section>
    </div>
  )
}
