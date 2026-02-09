import { NextRequest, NextResponse } from 'next/server'
import { ensureAdminRequest } from '@/lib/admin/auth'
import { evaluateExperiment } from '@/lib/services/experiment-service'

interface RouteParams {
  params: Promise<{ key: string }>
}

/**
 * GET /api/admin/experiments/[key]/evaluation - Get statistical analysis
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  const auth = ensureAdminRequest(req)
  if ('response' in auth) {
    return auth.response
  }

  if (!['superadmin', 'analyst'].includes(auth.session.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const { key } = await params
    const evaluation = await evaluateExperiment(key)

    return NextResponse.json({
      success: true,
      evaluation,
    })
  } catch (error: any) {
    console.error('Error evaluating experiment:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to evaluate experiment' },
      { status: 500 }
    )
  }
}
