import { NextResponse } from 'next/server'
import { listQuestDefinitions } from '@/lib/services/gamification-service'

export async function GET() {
  return NextResponse.json({ quests: listQuestDefinitions() })
}
