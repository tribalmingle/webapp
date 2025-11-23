import { getRedis } from '@/lib/redis/client'
import { withSpan } from '@/lib/observability/tracing'

const LEADERBOARD_KEY = 'gamification:leaderboard'

export type LeaderboardEntry = { userId: string; xp: number }

export class LeaderboardService {
  static async addXp(userId: string, xp: number) {
    return withSpan('leaderboard.addXp', async () => {
      const r = getRedis(); if (!r) return
      await r.zincrby(LEADERBOARD_KEY, xp, userId)
    }, { userId, xp })
  }

  static async top(n = 20): Promise<LeaderboardEntry[]> {
    return withSpan('leaderboard.top', async () => {
      const r = getRedis(); if (!r) return []
      const raw = await r.zrevrange(LEADERBOARD_KEY, 0, n - 1, 'WITHSCORES')
      const entries: LeaderboardEntry[] = []
      for (let i = 0; i < raw.length; i += 2) {
        entries.push({ userId: raw[i], xp: Number(raw[i + 1]) })
      }
      return entries
    }, { n })
  }
}
