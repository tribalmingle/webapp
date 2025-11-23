import React from 'react'
import { useFeatureFlag } from '@/lib/hooks/use-feature-flag'

async function fetchState() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/gamification/state`, { cache: 'no-store', headers: { 'x-user-id': 'demo-user' } })
  if (!res.ok) return null
  return res.json()
}

function FeatureGate({ children }: { children: React.ReactNode }) {
  'use client'
  const gamificationEnabled = useFeatureFlag('gamification-v1')
  
  if (!gamificationEnabled) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <h1>Quests</h1>
        <p>The gamification system is currently in development.</p>
        <p>Stay tuned for daily challenges, rewards, and leaderboards!</p>
      </div>
    )
  }
  
  return <>{children}</>
}

export default async function QuestsPage() {
  const state = await fetchState()
  return (
    <FeatureGate>
      <div style={{ padding: 24 }}>
        <h1>Quests</h1>
        {!state && <p>Unable to load quests.</p>}
        {state && (
          <ul>
            {state.quests.map((q: any) => (
              <li key={q.id} style={{ marginBottom: 12 }}>
                <strong>{q.title}</strong> – {q.description}<br />
                Progress: {q.progress}/{q.target} {q.completed && !q.claimed && ' (Complete – Ready to claim!)'} {q.claimed && ' (Claimed)'}
              </li>
            ))}
          </ul>
        )}
      </div>
    </FeatureGate>
  )
}
