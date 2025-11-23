import { NextResponse } from 'next/server'
import { LeaderboardService } from '@/lib/services/leaderboard-service'

export async function GET() {
  const entries = await LeaderboardService.top(20)
  return NextResponse.json({ entries })
}
