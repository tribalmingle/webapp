import React from 'react'
import { useFeatureFlag } from '@/lib/hooks/use-feature-flag'

async function fetchRealtime() {
  const query = `{ statsRealtime { activeUsers onlineNow coinsSpentToday giftsSentToday subscriptionRenewalsToday } dailySnapshots(limit: 7) { date activeUsers giftsSent coinSpent newSubscriptions referralSignups } }`
  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/graphql`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-user-id': 'demo-user' },
    body: JSON.stringify({ query }),
    cache: 'no-store'
  })
  if (!res.ok) return null
  return res.json()
}

function FeatureGate({ children }: { children: React.ReactNode }) {
  'use client'
  const insightsEnabled = useFeatureFlag('insights-ai-coach')
  
  if (!insightsEnabled) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <h1>Member Insights</h1>
        <p>This feature is currently in beta and not available for your account.</p>
        <p>Check back soon for advanced analytics and AI-powered coaching!</p>
      </div>
    )
  }
  
  return <>{children}</>
}

export default async function InsightsPage() {
  const data = await fetchRealtime()
  const stats = data?.data?.statsRealtime
  const snapshots = data?.data?.dailySnapshots || []
  
  return (
    <FeatureGate>
      <div style={{ padding: 24 }}>
        <h1>Member Insights</h1>
        {!stats && <p>Loading realtime stats...</p>}
        {stats && (
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            {Object.entries(stats).map(([k, v]) => (
              <div key={k} style={{ border: '1px solid #ccc', padding: 12, minWidth: 160 }}>
                <strong>{k}</strong>
                <div style={{ fontSize: 20 }}>{v as any}</div>
              </div>
            ))}
          </div>
        )}
        <h2 style={{ marginTop: 32 }}>Daily Trend (last {snapshots.length} days)</h2>
        <table style={{ borderCollapse: 'collapse', width: '100%' }}>
          <thead>
            <tr>
              <th>Date</th>
              <th>Active Users</th>
              <th>Gifts Sent</th>
              <th>Coin Spent</th>
              <th>Subscriptions</th>
              <th>Referral Signups</th>
            </tr>
          </thead>
          <tbody>
            {snapshots.map((s: any) => (
              <tr key={s.date}>
                <td>{s.date}</td>
                <td>{s.activeUsers}</td>
                <td>{s.giftsSent}</td>
                <td>{s.coinSpent}</td>
                <td>{s.newSubscriptions}</td>
                <td>{s.referralSignups}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </FeatureGate>
  )
}
