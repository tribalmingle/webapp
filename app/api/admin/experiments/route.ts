import { NextRequest, NextResponse } from 'next/server'
import { ensureAdminRequest } from '@/lib/admin/auth'
import {
  createExperiment,
  listExperiments,
  type CreateExperimentInput,
} from '@/lib/services/experiment-service'

/**
 * GET /api/admin/experiments - List all experiments
 * Query params: status, page, limit
 */
export async function GET(req: NextRequest) {
  const auth = ensureAdminRequest(req)
  if ('response' in auth) {
    return auth.response
  }

  // Only superadmin and analyst can view experiments
  if (!['superadmin', 'analyst'].includes(auth.session.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status') as any
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '20', 10)

    const experiments = await listExperiments({
      status,
      page,
      limit,
    })

    return NextResponse.json({
      success: true,
      ...experiments,
    })
  } catch (error: any) {
    console.error('Error fetching experiments:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch experiments' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/experiments - Create a new experiment
 */
export async function POST(req: NextRequest) {
  const auth = ensureAdminRequest(req)
  if ('response' in auth) {
    return auth.response
  }

  // Only superadmin can create experiments
  if (auth.session.role !== 'superadmin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const body = await req.json()

    // Validate required fields
    if (!body.experimentKey || !body.name || !body.variants?.length) {
      return NextResponse.json(
        { error: 'Missing required fields: experimentKey, name, variants' },
        { status: 400 }
      )
    }

    // Validate variants sum to 100
    const totalWeight = body.variants.reduce(
      (sum: number, v: { weight: number }) => sum + v.weight,
      0
    )
    if (totalWeight !== 100) {
      return NextResponse.json(
        { error: 'Variant weights must sum to 100' },
        { status: 400 }
      )
    }

    const input: CreateExperimentInput = {
      experimentKey: body.experimentKey,
      name: body.name,
      description: body.description,
      owner: body.owner,
      targetAudience: body.targetAudience,
      variants: body.variants,
      primaryMetric: body.primaryMetric || 'conversion',
      secondaryMetrics: body.secondaryMetrics,
      guardrails: body.guardrails,
      minSampleSize: body.minSampleSize,
      minDurationDays: body.minDurationDays,
    }

    const experiment = await createExperiment(input, auth.session.email)

    return NextResponse.json({
      success: true,
      experiment,
    })
  } catch (error: any) {
    console.error('Error creating experiment:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create experiment' },
      { status: 500 }
    )
  }
}
