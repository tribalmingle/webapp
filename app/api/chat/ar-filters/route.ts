import { NextResponse } from 'next/server'

import { arChatFilters } from '@/lib/data/ar-chat-filters'

export async function GET() {
  return NextResponse.json({ success: true, filters: arChatFilters })
}
