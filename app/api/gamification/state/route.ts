import { NextResponse } from 'next/server'
import { GamificationService } from '@/lib/services/gamification-service'

export async function GET(request: Request) {
  const userId = (await request.headers.get('x-user-id')) || 'demo-user'
  const quests = await GamificationService.listQuests(userId)
  return NextResponse.json({ quests })
}
