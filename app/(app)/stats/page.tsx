import React from 'react'
import { AnalyticsService, getRealtimeStats, listRecentSnapshots } from '../../../lib/services/analytics-service'

// Force this page to be dynamic to avoid MongoDB connection during build
export const dynamic = 'force-dynamic'
export const revalidate = 0

async function loadData() {
  const [realtime, snapshots, recentEvents] = await Promise.all([
    getRealtimeStats(),
    listRecentSnapshots(14),
    AnalyticsService.getRealtimeEvents(25)
  ])
  return { realtime, snapshots, recentEvents }
}

export default async function StatsPage() {
  const { realtime, snapshots, recentEvents } = await loadData()
  return (
    <div className="p-6 space-y-8">
      <h1 className="text-2xl font-semibold">Platform Stats</h1>
      <section className="grid md:grid-cols-5 gap-4">
        <StatCard label="Active Users (10m)" value={realtime.activeUsers} />
        <StatCard label="Online Now" value={realtime.onlineNow} />
        <StatCard label="Coins Spent Today" value={realtime.coinsSpentToday} />
        <StatCard label="Gifts Sent Today" value={realtime.giftsSentToday} />
        <StatCard label="Subscription Renewals" value={realtime.subscriptionRenewalsToday} />
      </section>
      <section className="space-y-3">
        <h2 className="text-lg font-medium">Recent Daily Snapshots</h2>
        <table className="w-full text-sm border">
          <thead className="bg-neutral-50">
            <tr>
              <Th>Date</Th>
              <Th>Active</Th>
              <Th>Gifts</Th>
              <Th>Coin Spent</Th>
              <Th>Subs</Th>
              <Th>Referrals</Th>
            </tr>
          </thead>
          <tbody>
            {snapshots.map(s => (
              <tr key={s.date} className="border-t">
                <Td>{s.date}</Td>
                <Td>{s.activeUsers}</Td>
                <Td>{s.giftsSent}</Td>
                <Td>{s.coinSpent}</Td>
                <Td>{s.newSubscriptions}</Td>
                <Td>{s.referralSignups}</Td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <section className="space-y-3">
        <h2 className="text-lg font-medium">Realtime Events (Latest)</h2>
        <div className="border rounded divide-y text-sm">
          {recentEvents.map(ev => (
            <div key={ev._id} className="p-2 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="font-mono text-xs text-neutral-500">{new Date(ev.timestamp).toLocaleTimeString()}</span>
                <span className="font-medium">{ev.eventType}</span>
              </div>
              <span className="text-xs text-neutral-400">{ev.userId || 'anon'}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

function StatCard({ label, value }: { label: string, value: number }) {
  return (
    <div className="border rounded p-4 flex flex-col gap-1 bg-white">
      <div className="text-xs uppercase tracking-wide text-neutral-500">{label}</div>
      <div className="text-xl font-semibold">{value}</div>
    </div>
  )
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="text-left px-2 py-1 font-medium border-b text-xs">{children}</th>
}
function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-2 py-1">{children}</td>
}
