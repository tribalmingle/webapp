/**
 * SLO Dashboard Component
 * Real-time monitoring dashboard for Service Level Objectives
 */

'use client'

import { useState, useEffect } from 'react'
import { Activity, TrendingUp, TrendingDown, AlertTriangle, CheckCircle } from 'lucide-react'

interface SLOStatus {
  slo: {
    id: string
    name: string
    description: string
    target: number
  }
  current: number
  target: number
  errorBudget: number
  errorBudgetRemaining: number
  status: 'healthy' | 'warning' | 'critical'
  lastUpdated: Date
}

export function SLODashboard() {
  const [slos, setSLOs] = useState<SLOStatus[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchSLOs()
    const interval = setInterval(fetchSLOs, 60000) // Refresh every minute
    return () => clearInterval(interval)
  }, [])

  const fetchSLOs = async () => {
    try {
      const response = await fetch('/api/admin/slo/status')
      const data = await response.json()
      setSLOs(data.slos || [])
    } catch (error) {
      console.error('Failed to fetch SLOs:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusColor = (status: SLOStatus['status']) => {
    switch (status) {
      case 'healthy':
        return 'text-green-600 bg-green-50 border-green-200'
      case 'warning':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'critical':
        return 'text-red-600 bg-red-50 border-red-200'
    }
  }

  const getStatusIcon = (status: SLOStatus['status']) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle size={20} />
      case 'warning':
        return <AlertTriangle size={20} />
      case 'critical':
        return <AlertTriangle size={20} />
    }
  }

  const overallHealth = slos.length > 0
    ? slos.reduce((sum, slo) => sum + slo.current, 0) / slos.length
    : 100

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading SLO data...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Overall Health */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold">Platform Health</h2>
            <p className="text-gray-600">Service Level Objectives</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-indigo-600">
              {overallHealth.toFixed(2)}%
            </div>
            <div className="text-sm text-gray-500">Overall Availability</div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mt-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {slos.filter(s => s.status === 'healthy').length}
            </div>
            <div className="text-sm text-gray-600">Healthy</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {slos.filter(s => s.status === 'warning').length}
            </div>
            <div className="text-sm text-gray-600">Warning</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">
              {slos.filter(s => s.status === 'critical').length}
            </div>
            <div className="text-sm text-gray-600">Critical</div>
          </div>
        </div>
      </div>

      {/* Individual SLOs */}
      <div className="grid gap-4">
        {slos.map((slo) => (
          <div
            key={slo.slo.id}
            className={`bg-white rounded-lg border p-6 ${getStatusColor(slo.status)}`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start gap-3">
                {getStatusIcon(slo.status)}
                <div>
                  <h3 className="font-semibold text-lg">{slo.slo.name}</h3>
                  <p className="text-sm opacity-75">{slo.slo.description}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">
                  {slo.current.toFixed(2)}%
                </div>
                <div className="text-xs opacity-75">
                  Target: {slo.target}%
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-4">
              <div className="flex justify-between text-xs mb-1">
                <span>Performance</span>
                <span>{slo.current.toFixed(2)}% / {slo.target}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${
                    slo.current >= slo.target
                      ? 'bg-green-600'
                      : slo.current >= slo.target - 1
                      ? 'bg-yellow-600'
                      : 'bg-red-600'
                  }`}
                  style={{ width: `${Math.min(slo.current, 100)}%` }}
                />
              </div>
            </div>

            {/* Error Budget */}
            <div className="flex items-center justify-between text-sm">
              <div>
                <span className="opacity-75">Error Budget:</span>{' '}
                <span className="font-medium">
                  {slo.errorBudgetRemaining.toFixed(3)}%
                </span>
              </div>
              <div className="flex items-center gap-1">
                {slo.current >= slo.target ? (
                  <>
                    <TrendingUp size={16} />
                    <span>Meeting SLO</span>
                  </>
                ) : (
                  <>
                    <TrendingDown size={16} />
                    <span>Below Target</span>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
