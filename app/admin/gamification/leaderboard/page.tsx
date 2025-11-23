import React from 'react'

async function fetchLeaderboard() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/gamification/leaderboard`, { cache: 'no-store' })
    if (!res.ok) return null
    return res.json()
  } catch { return null }
}

export default async function GamificationLeaderboardAdminPage() {
  const data = await fetchLeaderboard()
  return (
    <div style={{ padding: 24 }}>
      <h1>Gamification Leaderboard</h1>
      {!data && <p>Unable to load leaderboard.</p>}
      {data && (
        <table style={{ borderCollapse: 'collapse' }}>
          <thead>
            <tr><th>User</th><th>XP</th></tr>
          </thead>
          <tbody>
            {data.entries.map((e: any) => (
              <tr key={e.userId}><td>{e.userId}</td><td>{e.xp}</td></tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
