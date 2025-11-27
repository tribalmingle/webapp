'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Settings,
  Activity,
  CheckCircle,
  AlertTriangle,
  XCircle,
  RefreshCw,
  FileText,
  Lock,
  Gauge,
  BarChart3,
  ArrowRight,
} from 'lucide-react'

type HealthCheck = {
  service: string
  status: 'healthy' | 'degraded' | 'down'
  latency?: number
  message?: string
}

type HealthStatus = {
  status: string
  timestamp: string
  checks: HealthCheck[]
}

type AuditLog = {
  _id: string
  action: string
  userId: string
  resource: string
  timestamp: string
  metadata?: any
}

type ObservabilityLink = {
  title: string
  description: string
  href: string
  icon: typeof Activity
}

const runbooks = [
  {
    title: 'Support SLA Breach',
    category: 'Support',
    steps: [
      'Check /admin/support queue for breached tickets',
      'Assign to available agent immediately',
      'Escalate to support lead if urgent priority',
      'Send apology message to customer',
    ],
  },
  {
    title: 'Analytics Ingestion Lag',
    category: 'Analytics',
    steps: [
      'Check /api/admin/system/health for MongoDB status',
      'Review analytics_events collection size',
      'Restart ingestion workers if needed',
      'Monitor for 15 minutes to verify recovery',
    ],
  },
  {
    title: 'Trust Desk Queue Stuck',
    category: 'Trust & Safety',
    steps: [
      'Check /admin/trust for pending reports count',
      'Verify auto-moderation is running',
      'Manually review top 5 priority items',
      'Re-queue flagged items if needed',
    ],
  },
  {
    title: 'Payment Processing Failure',
    category: 'Billing',
    steps: [
      'Check Stripe dashboard for outages',
      'Review recent failed payments in /admin/billing',
      'Contact affected users if widespread',
      'Queue retry for transient failures',
    ],
  },
]

const observabilityLinks: ObservabilityLink[] = [
  {
    title: 'SLO Dashboard',
    description: 'Track error budgets, burn rates, and incident budgets.',
    href: '/admin/system/slos',
    icon: BarChart3,
  },
  {
    title: 'Performance Command Center',
    description: 'Monitor Core Web Vitals, backend latency, and infra usage.',
    href: '/admin/system/performance',
    icon: Gauge,
  },
]

export default function SystemPage() {
  const [health, setHealth] = useState<HealthStatus | null>(null)
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRunbook, setSelectedRunbook] = useState(runbooks[0])

  const loadHealth = async () => {
    const res = await fetch('/api/admin/system/health')
    const data = await res.json()
    setHealth(data)
  }

  const loadAuditLogs = async () => {
    const res = await fetch('/api/admin/system/audit')
    const data = await res.json()
    setAuditLogs(data)
  }

  const loadData = async () => {
    setLoading(true)
    await Promise.all([loadHealth(), loadAuditLogs()])
    setLoading(false)
  }

  useEffect(() => {
    loadData()
    const interval = setInterval(loadHealth, 30000) // Refresh health every 30s
    return () => clearInterval(interval)
  }, [])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'degraded':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      case 'down':
        return <XCircle className="h-5 w-5 text-red-500" />
      default:
        return <Activity className="h-5 w-5 text-gray-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    const colors = {
      healthy: 'bg-green-500 text-white',
      degraded: 'bg-yellow-500 text-black',
      down: 'bg-red-500 text-white',
    }
    return <Badge className={colors[status as keyof typeof colors] || 'bg-gray-500'}>
      {status.toUpperCase()}
    </Badge>
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Loading system status...</h1>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Settings className="h-8 w-8" />
              System Configuration
            </h1>
            <p className="text-muted-foreground">Monitor health, audit logs, and runbooks</p>
          </div>
          <Button onClick={loadData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 mb-6">
        {observabilityLinks.map((card) => {
          const Icon = card.icon
          return (
            <Link
              key={card.href}
              href={card.href}
              className="group block"
            >
              <div className="h-full border rounded-xl p-5 bg-white shadow-sm hover:border-indigo-200 hover:shadow-md transition flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-indigo-50 text-indigo-600">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-semibold text-lg">{card.title}</div>
                      <p className="text-sm text-gray-500">{card.description}</p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-indigo-500" />
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      {/* Health Status */}
      <Card className="p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Activity className="h-6 w-6" />
            System Health
          </h2>
          {health && getStatusBadge(health.status)}
        </div>

        {health && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {health.checks.map(check => (
              <div key={check.service} className="p-4 bg-muted rounded">
                <div className="flex items-center gap-2 mb-2">
                  {getStatusIcon(check.status)}
                  <span className="font-semibold">{check.service}</span>
                </div>
                {check.latency && (
                  <div className="text-sm text-muted-foreground">{check.latency}ms</div>
                )}
                {check.message && (
                  <div className="text-xs text-red-500 mt-1">{check.message}</div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      <div className="grid grid-cols-2 gap-6">
        {/* Runbooks */}
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <FileText className="h-6 w-6" />
            Runbooks
          </h2>
          
          <div className="grid grid-cols-2 gap-2 mb-4">
            {runbooks.map(runbook => (
              <Button
                key={runbook.title}
                variant={selectedRunbook.title === runbook.title ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedRunbook(runbook)}
                className="text-xs"
              >
                {runbook.title}
              </Button>
            ))}
          </div>

          <div className="p-4 bg-muted rounded">
            <h3 className="font-bold mb-2">{selectedRunbook.title}</h3>
            <Badge variant="outline" className="mb-3">{selectedRunbook.category}</Badge>
            <ol className="list-decimal list-inside space-y-2">
              {selectedRunbook.steps.map((step, idx) => (
                <li key={idx} className="text-sm">{step}</li>
              ))}
            </ol>
          </div>
        </Card>

        {/* Audit Logs */}
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Lock className="h-6 w-6" />
            Audit Logs
          </h2>
          
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {auditLogs.length > 0 ? (
              auditLogs.map(log => (
                <div key={log._id} className="p-3 bg-muted rounded text-sm">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold">{log.action}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(log.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Resource: {log.resource}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Lock className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No audit logs yet</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Environment Variables */}
      <Card className="p-6 mt-6">
        <h2 className="text-xl font-bold mb-4">Environment Configuration</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-muted rounded">
            <div className="text-sm font-semibold">NODE_ENV</div>
            <div className="text-xs text-muted-foreground mt-1">
              {process.env.NODE_ENV || 'development'}
            </div>
          </div>
          <div className="p-3 bg-muted rounded">
            <div className="text-sm font-semibold">Database</div>
            <div className="text-xs text-muted-foreground mt-1">
              {process.env.MONGODB_URI ? 'Configured' : 'Not configured'}
            </div>
          </div>
          <div className="p-3 bg-muted rounded">
            <div className="text-sm font-semibold">Stripe</div>
            <div className="text-xs text-muted-foreground mt-1">
              {process.env.STRIPE_SECRET_KEY ? 'Configured' : 'Not configured'}
            </div>
          </div>
          <div className="p-3 bg-muted rounded">
            <div className="text-sm font-semibold">AWS S3</div>
            <div className="text-xs text-muted-foreground mt-1">
              {process.env.AWS_ACCESS_KEY_ID ? 'Configured' : 'Not configured'}
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
