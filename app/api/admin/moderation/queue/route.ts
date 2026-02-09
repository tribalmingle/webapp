import { NextRequest, NextResponse } from 'next/server'
import { ensureAdminRequest } from '@/lib/admin/auth'
import {
  getModerationQueue,
  type ReportStatus,
  type ReportPriority,
  type ReportCategory,
} from '@/lib/services/moderation-service'

/**
 * GET /api/admin/moderation/queue - Get moderation queue with filters
 */
export async function GET(req: NextRequest) {
  const auth = ensureAdminRequest(req)
  if ('response' in auth) {
    return auth.response
  }

  // Moderators, support, and superadmin can view queue
  if (!['superadmin', 'moderator', 'support'].includes(auth.session.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const { searchParams } = new URL(req.url)

    const status = searchParams.get('status')?.split(',') as ReportStatus[] | undefined
    const priority = searchParams.get('priority')?.split(',') as ReportPriority[] | undefined
    const category = searchParams.get('category')?.split(',') as ReportCategory[] | undefined
    const assignedTo = searchParams.get('assignedTo') || undefined
    const slaBreach = searchParams.get('slaBreach') === 'true'
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '50', 10)

    const queue = await getModerationQueue({
      status,
      priority,
      category,
      assignedTo,
      slaBreach,
      page,
      limit,
    })

    return NextResponse.json({
      success: true,
      ...queue,
    })
  } catch (error: any) {
    console.error('Error fetching moderation queue:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch queue' },
      { status: 500 }
    )
  }
}
