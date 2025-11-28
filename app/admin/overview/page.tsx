'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Users, MessageCircle, Heart, DollarSign, TrendingUp, TrendingDown,
  Activity, AlertTriangle, Settings, LogOut, LayoutDashboard,
  Shield, Megaphone, UserCog, Calendar, BarChart3, Beaker, Server
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

interface MetricCard {
  title: string
  value: string | number
  trend: number
  icon: React.ReactNode
}

interface Experiment {
  key: string
  name: string
  status: 'running' | 'paused' | 'completed'
  variants: { name: string; percentage: number; users: number }[]
  startDate: string
  sampleSize: number
}

interface Alert {
  id: string
  type: 'warning' | 'error' | 'info'
  message: string
  timestamp: string
  module: string
}

interface OverviewMetrics {
  dau: number
  mau: number
  activeConversations: number
  matchesToday: number
  revenueToday: number
  trends: {
    dau: { date: string; value: number }[]
    conversations: { date: string; value: number }[]
    matches: { date: string; value: number }[]
    revenue: { date: string; value: number }[]
  }
}

export default function AdminOverviewPage() {
  const router = useRouter()
  const [metrics, setMetrics] = useState<OverviewMetrics | null>(null)
  const [experiments, setExperiments] = useState<Experiment[]>([])
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchOverviewData()
    const interval = setInterval(fetchOverviewData, 60000) // Refresh every 60s
    return () => clearInterval(interval)
  }, [])

  const fetchOverviewData = async () => {
    try {
      const [metricsRes, experimentsRes, alertsRes] = await Promise.all([
        fetch('/api/admin/overview/metrics'),
        fetch('/api/admin/overview/experiments'),
        fetch('/api/admin/overview/alerts')
      ])

      const [metricsData, experimentsData, alertsData] = await Promise.all([
        metricsRes.json(),
        experimentsRes.json(),
        alertsRes.json()
      ])

      setMetrics(metricsData)
      setExperiments(experimentsData.experiments || [])
      setAlerts(alertsData.alerts || [])
    } catch (error) {
      console.error('Error fetching overview data:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num)
  }

  const calculateTrend = (data: { value: number }[]) => {
    if (data.length < 2) return 0
    const recent = data[data.length - 1].value
    const previous = data[data.length - 2].value
    if (previous === 0) return 0
    return ((recent - previous) / previous) * 100
  }

  const metricCards: MetricCard[] = metrics
    ? [
        {
          title: 'Daily Active Users',
          value: formatNumber(metrics.dau),
          trend: calculateTrend(metrics.trends.dau),
          icon: <Users className="h-4 w-4 text-purple-royal" />
        },
        {
          title: 'Monthly Active Users',
          value: formatNumber(metrics.mau),
          trend: 0,
          icon: <Activity className="h-4 w-4 text-purple-royal-light" />
        },
        {
          title: 'Active Conversations',
          value: formatNumber(metrics.activeConversations),
          trend: calculateTrend(metrics.trends.conversations),
          icon: <MessageCircle className="h-4 w-4 text-gold-warm" />
        },
        {
          title: 'Matches Today',
          value: formatNumber(metrics.matchesToday),
          trend: calculateTrend(metrics.trends.matches),
          icon: <Heart className="h-4 w-4 text-gold-warm" />
        },
        {
          title: 'Revenue Today',
          value: formatCurrency(metrics.revenueToday),
          trend: calculateTrend(metrics.trends.revenue),
          icon: <DollarSign className="h-4 w-4 text-gold-warm" />
        }
      ]
    : []

  const moduleLinks = [
    { href: '/admin/trust', label: 'Trust & Safety', icon: Shield, color: 'text-destructive' },
    { href: '/admin/growth', label: 'Growth Lab', icon: Megaphone, color: 'text-purple-royal' },
    { href: '/admin/crm', label: 'CRM', icon: UserCog, color: 'text-purple-royal-light' },
    { href: '/admin/events', label: 'Events', icon: Calendar, color: 'text-gold-warm' },
    { href: '/admin/billing', label: 'Revenue', icon: BarChart3, color: 'text-gold-warm' },
    { href: '/admin/labs', label: 'Labs', icon: Beaker, color: 'text-purple-royal' },
    { href: '/admin/system', label: 'System', icon: Server, color: 'text-text-secondary' },
    { href: '/admin/support', label: 'Support', icon: MessageCircle, color: 'text-purple-royal-light' }
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-background-primary flex items-center justify-center">
        <div className="text-center">
          <Activity className="h-8 w-8 animate-spin mx-auto text-purple-royal" />
          <p className="mt-2 text-sm text-text-secondary">Loading admin dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background-primary">
      {/* Header */}
      <header className="bg-background-secondary border-b border-border-gold/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <LayoutDashboard className="h-6 w-6 text-purple-royal" />
              <h1 className="text-xl font-semibold text-text-primary">Admin Studio</h1>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => router.push('/admin/settings')}>
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
              <Button variant="ghost" size="sm" onClick={() => router.push('/login')}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          {metricCards.map((card, index) => (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {card.title}
                </CardTitle>
                {card.icon}
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">{card.value}</div>
                {card.trend !== 0 && (
                  <div className="flex items-center mt-1 text-xs">
                    {card.trend > 0 ? (
                      <TrendingUp className="h-3 w-3 text-gold-warm mr-1" />
                    ) : (
                      <TrendingDown className="h-3 w-3 text-destructive mr-1" />
                    )}
                    <span className={card.trend > 0 ? 'text-gold-warm' : 'text-destructive'}>
                      {Math.abs(card.trend).toFixed(1)}%
                    </span>
                    <span className="text-text-tertiary ml-1">vs yesterday</span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* 7-Day Trends */}
        {metrics && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle>Daily Active Users (7 days)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={metrics.trends.dau}>
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} tickFormatter={(val) => new Date(val).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Revenue Trend (7 days)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={metrics.trends.revenue}>
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} tickFormatter={(val) => new Date(val).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} />
                    <YAxis tick={{ fontSize: 12 }} tickFormatter={(val) => `$${val}`} />
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Module Navigation */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Admin Modules</CardTitle>
            <CardDescription>Quick access to all admin tools</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {moduleLinks.map((link) => (
                <Button
                  key={link.href}
                  variant="outline"
                  className="h-20 flex flex-col items-center justify-center gap-2"
                  onClick={() => router.push(link.href)}
                >
                  <link.icon className={`h-6 w-6 ${link.color}`} />
                  <span className="text-sm font-medium">{link.label}</span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Active Experiments */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Active Experiments</CardTitle>
            <CardDescription>A/B tests currently running</CardDescription>
          </CardHeader>
          <CardContent>
            {experiments.length === 0 ? (
              <p className="text-sm text-gray-500">No active experiments</p>
            ) : (
              <div className="space-y-4">
                {experiments.map((exp) => (
                  <div key={exp.key} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-medium text-gray-900">{exp.name}</h4>
                        <p className="text-xs text-gray-500">
                          Started {new Date(exp.startDate).toLocaleDateString()} · {formatNumber(exp.sampleSize)} users
                        </p>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        exp.status === 'running' ? 'bg-green-100 text-green-800' :
                        exp.status === 'paused' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-background-tertiary text-text-primary'
                      }`}>
                        {exp.status}
                      </span>
                    </div>
                    <div className="flex gap-4 text-sm">
                      {exp.variants.map((variant) => (
                        <div key={variant.name} className="flex-1">
                          <div className="text-gray-600">{variant.name}</div>
                          <div className="font-medium">{variant.percentage}% ({formatNumber(variant.users)} users)</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Alerts */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Alerts</CardTitle>
            <CardDescription>System notifications and anomalies</CardDescription>
          </CardHeader>
          <CardContent>
            {alerts.length === 0 ? (
              <p className="text-sm text-gray-500">No recent alerts</p>
            ) : (
              <div className="space-y-3">
                {alerts.map((alert) => (
                  <div key={alert.id} className="flex items-start gap-3 p-3 border rounded-lg">
                    <AlertTriangle className={`h-5 w-5 mt-0.5 ${
                      alert.type === 'error' ? 'text-red-600' :
                      alert.type === 'warning' ? 'text-yellow-600' :
                      'text-blue-600'
                    }`} />
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">{alert.message}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {alert.module} · {new Date(alert.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}


