import { NextResponse } from 'next/server'
import { GamificationService } from '@/lib/services/gamification-service'

export async function POST(request: Request, { params }: { params: { questId: string } }) {
  const userId = (await request.headers.get('x-user-id')) || 'demo-user'
  try {
    const result = await GamificationService.claimQuest(userId, params.questId)
    return NextResponse.json(result)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
