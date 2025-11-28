'use client'

import { useState, useEffect } from 'react'
import { FileText, Download, Search, Filter, Calendar, AlertCircle, Info, AlertTriangle, XCircle } from 'lucide-react'
import { ADMIN_COLORS } from '@/lib/constants/admin-theme'

interface AuditLog {
  _id: string
  timestamp: Date
  eventType: string
  severity: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL'
  actorId?: string
  actorEmail?: string
  targetId?: string
  targetType?: string
  action: string
  metadata?: Record<string, any>
  ip?: string
  userAgent?: string
}

interface AuditFilters {
  eventType: string
  severity: string
  actorId: string
  startDate: string
  endDate: string
  searchQuery: string
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [totalCount, setTotalCount] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(50)
  const [filters, setFilters] = useState<AuditFilters>({
    eventType: '',
    severity: '',
    actorId: '',
    startDate: '',
    endDate: '',
    searchQuery: '',
  })
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    loadLogs()
  }, [page, filters])

  const loadLogs = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pageSize.toString(),
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, v]) => v !== '')
        ),
      })

      const response = await fetch(`/api/admin/audit-logs?${params}`)
      if (response.ok) {
        const data = await response.json()
        setLogs(data.logs || [])
        setTotalCount(data.total || 0)
      }
    } catch (error) {
      console.error('Failed to load audit logs:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async (format: 'json' | 'csv') => {
    try {
      const params = new URLSearchParams({
        format,
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, v]) => v !== '')
        ),
      })

      const response = await fetch(`/api/admin/audit-logs/export?${params}`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `audit-logs-${new Date().toISOString()}.${format}`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error('Failed to export logs:', error)
      alert('Failed to export logs')
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'INFO':
        return <Info className="w-5 h-5 text-purple-royal" />
      case 'WARNING':
        return <AlertTriangle className="w-5 h-5 text-purple-royal-light" />
      case 'ERROR':
        return <AlertCircle className="w-5 h-5 text-gold-warm" />
      case 'CRITICAL':
        return <XCircle className="w-5 h-5 text-destructive" />
      default:
        return <Info className="w-5 h-5 text-text-tertiary" />
    }
  }

  const getSeverityBadge = (severity: string) => {
    const severityKey = severity as 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL'
    const severityMap = {
      INFO: 'info',
      WARNING: 'warning',
      ERROR: 'error',
      CRITICAL: 'error',
    } as const
    return ADMIN_COLORS.badge[severityMap[severityKey] || 'neutral']
  }

  const totalPages = Math.ceil(totalCount / pageSize)

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <FileText className="w-8 h-8 text-purple-royal" />
            <h1 className="text-3xl font-bold text-purple-royal">Audit Logs</h1>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleExport('json')}
              className="flex items-center gap-2 px-4 py-2 bg-purple-royal text-white rounded-lg hover:bg-purple-royal-dark"
            >
              <Download className="w-4 h-4" />
              Export JSON
            </button>
            <button
              onClick={() => handleExport('csv')}
              className="flex items-center gap-2 px-4 py-2 bg-gold-gradient text-white rounded-lg hover:opacity-90"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>
        </div>
        <p className="text-gray-600">
          View and export audit trail of all system activities. Total: {totalCount.toLocaleString()} events
        </p>
      </div>

      {/* Filters */}
      <div className="bg-background-secondary rounded-lg border border-border-gold/20 mb-6">
        <div className="p-4 border-b border-border-gold/20 flex items-center justify-between">
          <h2 className="font-semibold flex items-center gap-2 text-purple-royal">
            <Filter className="w-5 h-5" />
            Filters
          </h2>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="text-sm text-purple-royal-light hover:text-purple-royal"
          >
            {showFilters ? 'Hide' : 'Show'}
          </button>
        </div>
        {showFilters && (
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Event Type
              </label>
              <input
                type="text"
                value={filters.eventType}
                onChange={(e) => setFilters({ ...filters, eventType: e.target.value })}
                placeholder="e.g., user.login"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Severity
              </label>
              <select
                value={filters.severity}
                onChange={(e) => setFilters({ ...filters, severity: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Severities</option>
                <option value="INFO">Info</option>
                <option value="WARNING">Warning</option>
                <option value="ERROR">Error</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search
              </label>
              <input
                type="text"
                value={filters.searchQuery}
                onChange={(e) => setFilters({ ...filters, searchQuery: e.target.value })}
                placeholder="Search action, metadata..."
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="datetime-local"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                type="datetime-local"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={() => {
                  setFilters({
                    eventType: '',
                    severity: '',
                    actorId: '',
                    startDate: '',
                    endDate: '',
                    searchQuery: '',
                  })
                  setPage(1)
                }}
                className="w-full px-4 py-2 bg-background-tertiary text-text-primary rounded-lg hover:bg-background-tertiary/70 border border-border-gold/20"
              >
                Clear Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Logs Table */}
      <div className="bg-background-secondary rounded-lg border border-border-gold/20 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-background-tertiary border-b border-border-gold/20">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">
                  Timestamp
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">
                  Severity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">
                  Event Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Details
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    Loading audit logs...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    No audit logs found
                  </td>
                </tr>
              ) : (
                logs.map(log => (
                  <tr key={log._id} className="hover:bg-background-tertiary/50 border-b border-border-gold/10">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {getSeverityIcon(log.severity)}
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityBadge(log.severity)}`}>
                          {log.severity}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-text-primary">
                      {log.eventType}
                    </td>
                    <td className="px-6 py-4 text-sm text-text-primary">
                      {log.action}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                      {log.actorEmail || log.actorId || 'System'}
                    </td>
                    <td className="px-6 py-4 text-sm text-text-secondary">
                      {log.metadata && Object.keys(log.metadata).length > 0 ? (
                        <details className="cursor-pointer">
                          <summary className="text-purple-royal-light hover:text-purple-royal">
                            View Details
                          </summary>
                          <pre className="mt-2 text-xs bg-background-tertiary p-2 rounded overflow-auto max-w-md">
                            {JSON.stringify(log.metadata, null, 2)}
                          </pre>
                        </details>
                      ) : (
                        <span className="text-text-tertiary">No details</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-border-gold/20 flex items-center justify-between">
            <div className="text-sm text-text-secondary">
              Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, totalCount)} of {totalCount} logs
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 border border-border-gold/20 rounded-lg hover:bg-background-tertiary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="px-4 py-2 border border-border-gold/20 rounded-lg bg-purple-royal/20 text-purple-royal font-medium">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 border border-border-gold/20 rounded-lg hover:bg-background-tertiary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
