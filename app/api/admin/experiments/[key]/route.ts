import { NextRequest, NextResponse } from 'next/server'
import { ensureAdminRequest } from '@/lib/admin/auth'
import {
  getExperiment,
  startExperiment,
  pauseExperiment,
  resumeExperiment,
  completeExperiment,
  evaluateExperiment,
  rolloutExperiment,
  rollbackExperiment,
} from '@/lib/services/experiment-service'

interface RouteParams {
  params: Promise<{ key: string }>
}

/**
 * GET /api/admin/experiments/[key] - Get experiment details
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
    const experiment = await getExperiment(key)

    if (!experiment) {
      return NextResponse.json({ error: 'Experiment not found' }, { status: 404 })
    }

    // If running, include current evaluation
    let evaluation = null
    if (experiment.status === 'running') {
      evaluation = await evaluateExperiment(key)
    }

    return NextResponse.json({
      success: true,
      experiment,
      evaluation,
    })
  } catch (error: any) {
    console.error('Error fetching experiment:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch experiment' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/experiments/[key] - Delete experiment (draft only)
 */
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const auth = ensureAdminRequest(req)
  if ('response' in auth) {
    return auth.response
  }

  if (auth.session.role !== 'superadmin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const { key } = await params
    const experiment = await getExperiment(key)

    if (!experiment) {
      return NextResponse.json({ error: 'Experiment not found' }, { status: 404 })
    }

    if (experiment.status !== 'draft') {
      return NextResponse.json(
        { error: 'Can only delete draft experiments' },
        { status: 400 }
      )
    }

    // Import db to delete
    const { getMongoDb } = await import('@/lib/mongodb')
    const db = await getMongoDb()

    await db.collection('experiments').deleteOne({ key })

    return NextResponse.json({
      success: true,
      message: 'Experiment deleted',
    })
  } catch (error: any) {
    console.error('Error deleting experiment:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete experiment' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/experiments/[key] - Experiment actions (start, pause, resume, stop, rollout, rollback)
 */
export async function POST(req: NextRequest, { params }: RouteParams) {
  const auth = ensureAdminRequest(req)
  if ('response' in auth) {
    return auth.response
  }

  if (auth.session.role !== 'superadmin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const { key } = await params
    const body = await req.json()
    const { action, winningVariant, rolloutPercentage } = body

    if (!action) {
      return NextResponse.json({ error: 'Action required' }, { status: 400 })
    }

    const actorId = auth.session.email

    switch (action) {
      case 'start':
        await startExperiment(key)
        break

      case 'pause':
        await pauseExperiment(key)
        break

      case 'resume':
        await resumeExperiment(key)
        break

      case 'complete':
        await completeExperiment(key)
        break

      case 'rollout':
        if (!winningVariant) {
          return NextResponse.json(
            { error: 'winningVariant required for rollout' },
            { status: 400 }
          )
        }
        await rolloutExperiment(key, winningVariant, rolloutPercentage)
        break

      case 'rollback':
        await rollbackExperiment(key, body.reason || 'No reason provided')
        break

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    const updatedExperiment = await getExperiment(key)

    return NextResponse.json({
      success: true,
      experiment: updatedExperiment,
      message: `Experiment ${action} successful`,
    })
  } catch (error: any) {
    console.error('Error performing experiment action:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to perform action' },
      { status: 500 }
    )
  }
}
