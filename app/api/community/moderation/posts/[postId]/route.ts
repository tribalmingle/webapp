import { NextResponse } from 'next/server'
import { CommunityService } from '@/lib/services/community-service'

export async function POST(request: Request, { params }: { params: { postId: string } }) {
  try {
    const body = await request.json().catch(() => ({}))
    const action = body.action === 'approve' ? 'approve' : body.action === 'reject' ? 'reject' : null
    if (!action) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
    // TODO: replace with real auth (guardian/admin check)
    const actorId = body.actorId || 'admin-test-user'
    await CommunityService.moderatePost(params.postId, actorId, action, body.notes)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: error.status ?? 500 })
  }
}
