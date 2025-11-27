'use client'

import React, { useEffect, useState } from 'react'
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Card } from '@/components/ui/card'

interface BillingStats {
  mrr: number
  activeSubscriptions: {
    free: number
    concierge: number
    guardian: number
    premium_plus: number
  }
  trialConversions: {
    total: number
    converted: number
    conversionRate: number
  }
  churnRate: number
  revenueCohorts: Array<{
    month: string
    revenue: number
    newSubscribers: number
  }>
}

interface LTVData {
  cohort: string
  users: number
  revenue: number
  ltv: number
}

interface ARPUData {
  date: string
  activeUsers: number
  revenue: number
  arpu: number
}

interface RefundStats {
  stats: {
    totalPayments: number
    totalAmount: number
    refundedCount: number
    refundedAmount: number
    refundRate: number
  }
  refunds: any[]
}

const COLORS = ['#94a3b8', '#3b82f6', '#8b5cf6', '#f59e0b']

export default function BillingDashboard() {
  const [stats, setStats] = useState<BillingStats | null>(null)
  const [ltvData, setLtvData] = useState<LTVData[]>([])
  const [arpuData, setArpuData] = useState<ARPUData[]>([])
  const [refundStats, setRefundStats] = useState<RefundStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/billing/stats').then(res => res.json()),
      fetch('/api/admin/billing/ltv?cohortMonths=6').then(res => res.json()),
      fetch('/api/admin/billing/arpu?days=30').then(res => res.json()),
      fetch('/api/admin/billing/refunds?days=30').then(res => res.json()),
    ])
      .then(([statsData, ltvData, arpuData, refundData]) => {
        setStats(statsData)
        setLtvData(ltvData)
        setArpuData(arpuData)
        setRefundStats(refundData)
        setLoading(false)
      })
      .catch(error => {
        console.error('Failed to fetch billing data:', error)
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-8">Billing Dashboard</h1>
        <p className="text-neutral-500">Loading billing metrics...</p>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-8">Billing Dashboard</h1>
        <p className="text-red-500">Failed to load billing stats. Please try again.</p>
      </div>
    )
  }

  const planData = [
    { name: 'Free', value: stats.activeSubscriptions.free, color: COLORS[0] },
    { name: 'Concierge', value: stats.activeSubscriptions.concierge, color: COLORS[1] },
    { name: 'Guardian', value: stats.activeSubscriptions.guardian, color: COLORS[2] },
    { name: 'Premium Plus', value: stats.activeSubscriptions.premium_plus, color: COLORS[3] },
  ]

  const totalActive = Object.values(stats.activeSubscriptions).reduce((a, b) => a + b, 0)

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Billing Dashboard</h1>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="border rounded-lg p-6 bg-white dark:bg-neutral-900">
          <h3 className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Monthly Recurring Revenue</h3>
          <p className="text-3xl font-bold mt-2">${(stats.mrr / 100).toFixed(2)}</p>
        </div>
        <div className="border rounded-lg p-6 bg-white dark:bg-neutral-900">
          <h3 className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Active Subscriptions</h3>
          <p className="text-3xl font-bold mt-2">{totalActive}</p>
          <p className="text-xs text-neutral-500 mt-1">{stats.activeSubscriptions.free} free</p>
        </div>
        <div className="border rounded-lg p-6 bg-white dark:bg-neutral-900">
          <h3 className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Trial Conversion Rate</h3>
          <p className="text-3xl font-bold mt-2">{stats.trialConversions.conversionRate.toFixed(1)}%</p>
          <p className="text-xs text-neutral-500 mt-1">{stats.trialConversions.converted}/{stats.trialConversions.total} converted</p>
        </div>
        <div className="border rounded-lg p-6 bg-white dark:bg-neutral-900">
          <h3 className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Churn Rate (30d)</h3>
          <p className="text-3xl font-bold mt-2">{stats.churnRate.toFixed(1)}%</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* MRR Trend */}
        <div className="border rounded-lg p-6 bg-white dark:bg-neutral-900">
          <h2 className="text-xl font-semibold mb-4">MRR Trend (Last 6 Months)</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={stats.revenueCohorts}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value: number) => `$${(value / 100).toFixed(2)}`} />
              <Legend />
              <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} name="Revenue" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Plan Distribution */}
        <div className="border rounded-lg p-6 bg-white dark:bg-neutral-900">
          <h2 className="text-xl font-semibold mb-4">Subscription Plan Distribution</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={planData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => `${entry.name}: ${entry.value}`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {planData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* New Subscribers by Month */}
        <div className="border rounded-lg p-6 bg-white dark:bg-neutral-900">
          <h2 className="text-xl font-semibold mb-4">New Subscribers (Last 6 Months)</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats.revenueCohorts}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="newSubscribers" fill="#8b5cf6" name="New Subscribers" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Revenue Breakdown Table */}
        <div className="border rounded-lg p-6 bg-white dark:bg-neutral-900">
          <h2 className="text-xl font-semibold mb-4">Revenue by Plan</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Plan</th>
                <th className="text-right py-2">Subscribers</th>
                <th className="text-right py-2">MRR</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="py-2">Free</td>
                <td className="text-right">{stats.activeSubscriptions.free}</td>
                <td className="text-right">$0.00</td>
              </tr>
              <tr className="border-b">
                <td className="py-2">Concierge</td>
                <td className="text-right">{stats.activeSubscriptions.concierge}</td>
                <td className="text-right">${(stats.activeSubscriptions.concierge * 10).toFixed(2)}</td>
              </tr>
              <tr className="border-b">
                <td className="py-2">Guardian</td>
                <td className="text-right">{stats.activeSubscriptions.guardian}</td>
                <td className="text-right">${(stats.activeSubscriptions.guardian * 20).toFixed(2)}</td>
              </tr>
              <tr className="border-b">
                <td className="py-2">Premium Plus</td>
                <td className="text-right">{stats.activeSubscriptions.premium_plus}</td>
                <td className="text-right">${(stats.activeSubscriptions.premium_plus * 30).toFixed(2)}</td>
              </tr>
              <tr className="font-bold">
                <td className="py-2">Total</td>
                <td className="text-right">{totalActive}</td>
                <td className="text-right">${(stats.mrr / 100).toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* LTV by Cohort */}
      <Card className="p-6 mb-6">
        <h3 className="text-lg font-bold mb-4">LTV by Cohort</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={ltvData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="cohort" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="ltv" fill="#3b82f6" name="Average LTV ($)" />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* ARPU Trend */}
      <Card className="p-6 mb-6">
        <h3 className="text-lg font-bold mb-4">ARPU Trend (30 Days)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={arpuData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="arpu" stroke="#8b5cf6" name="ARPU ($)" />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* Refund Stats */}
      {refundStats && (
        <Card className="p-6 mb-6">
          <h3 className="text-lg font-bold mb-4">Refund Analytics (30 Days)</h3>
          <div className="grid grid-cols-4 gap-4 mb-4">
            <div>
              <div className="text-sm text-muted-foreground">Total Payments</div>
              <div className="text-2xl font-bold">{refundStats.stats.totalPayments}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Refunded</div>
              <div className="text-2xl font-bold">{refundStats.stats.refundedCount}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Refund Rate</div>
              <div className="text-2xl font-bold">{refundStats.stats.refundRate.toFixed(1)}%</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Amount Refunded</div>
              <div className="text-2xl font-bold">${(refundStats.stats.refundedAmount / 100).toFixed(2)}</div>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
