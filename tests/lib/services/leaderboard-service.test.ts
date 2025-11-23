import { describe, it, expect } from 'vitest'
import { LeaderboardService } from '@/lib/services/leaderboard-service'

describe('LeaderboardService', () => {
  it('adds XP and returns top entries', async () => {
    await LeaderboardService.addXp('userA', 50)
    await LeaderboardService.addXp('userB', 25)
    const top = await LeaderboardService.top(2)
    expect(top[0].userId).toBeDefined()
    expect(top.length).toBeGreaterThan(0)
  })
})
