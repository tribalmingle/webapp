import React from 'react'

async function fetchQueue() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/community/moderation/queue`, { cache: 'no-store' })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

export default async function CommunityModerationPage() {
  const queue = await fetchQueue()
  return (
    <div style={{ padding: 24 }}>
      <h1>Community Moderation Queue</h1>
      {!queue && <p>Unable to load queue.</p>}
      {queue && (
        <>
          <h2>Posts</h2>
          <ul>
            {queue.posts.map((p: any) => (
              <li key={p.id} style={{ marginBottom: 8 }}>
                <strong>{p.author.name || p.author.userId}</strong>: {p.body?.slice(0, 140) || '[Rich Content]'} ({p.safety.state})
              </li>
            ))}
          </ul>
          <h2>Comments</h2>
          <ul>
            {queue.comments.map((c: any) => (
              <li key={c.id} style={{ marginBottom: 8 }}>
                <strong>{c.author.name || c.author.userId}</strong>: {c.body?.slice(0, 140)} ({c.safety.state})
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}
