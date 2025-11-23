// Phase 7: MemberAnalyticsService stub
// Provides mock aggregation for member-facing stats before real data pipeline wiring.

export interface MemberStats {
  profileViews: number
  likeRate: number // likes received / profile views
  matchCount: number
  avgResponseMinutes: number
  topTribes: string[]
}

export async function aggregateProfileStats(userId: string): Promise<MemberStats> {
  // Placeholder deterministic mock using hash of userId for variability.
  const seed = Array.from(userId).reduce((acc, ch) => acc + ch.charCodeAt(0), 0)
  const views = 50 + (seed % 200)
  const matches = Math.floor(views * 0.1)
  const likes = Math.floor(views * 0.3)
  return {
    profileViews: views,
    likeRate: parseFloat((likes / views).toFixed(2)),
    matchCount: matches,
    avgResponseMinutes: 15 + (seed % 45),
    topTribes: ['Yoruba', 'Igbo', 'Zulu'].slice(0, (seed % 3) + 1)
  }
}

// TODO (Phase 7): Replace with real aggregation pulling from interactions/matches collections + caching layer.
