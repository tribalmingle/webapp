/**
 * API: Get jobs from a specific queue and control queue operations
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  getQueue,
  pauseQueue,
  resumeQueue,
  drainQueue,
  type QueueName,
  QueueNames,
} from '@/lib/jobs/queue-setup'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ queueName: string }> }
) {
  try {
    const resolvedParams = await params
    const queueName = resolvedParams.queueName as QueueName
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'active'

    // Validate queue name
    if (!Object.values(QueueNames).includes(queueName)) {
      return NextResponse.json(
        { error: 'Invalid queue name' },
        { status: 400 }
      )
    }

    const queue = getQueue(queueName)

    let jobs: any[]

    switch (type) {
      case 'waiting':
        jobs = await queue.getWaiting(0, 100)
        break
      case 'active':
        jobs = await queue.getActive(0, 100)
        break
      case 'completed':
        jobs = await queue.getCompleted(0, 100)
        break
      case 'failed':
        jobs = await queue.getFailed(0, 100)
        break
      default:
        return NextResponse.json(
          { error: 'Invalid job type' },
          { status: 400 }
        )
    }

    const formattedJobs = jobs.map((job) => ({
      id: job.id,
      name: job.name,
      data: job.data,
      progress: job.progress || 0,
      attemptsMade: job.attemptsMade,
      timestamp: job.timestamp,
      processedOn: job.processedOn,
      finishedOn: job.finishedOn,
      failedReason: job.failedReason,
    }))

    return NextResponse.json({ jobs: formattedJobs })
  } catch (error) {
    console.error('[api/jobs/[queueName]] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch jobs' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ queueName: string }> }
) {
  try {
    const resolvedParams = await params
    const queueName = resolvedParams.queueName as QueueName
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    // Validate queue name
    if (!Object.values(QueueNames).includes(queueName)) {
      return NextResponse.json(
        { error: 'Invalid queue name' },
        { status: 400 }
      )
    }

    switch (action) {
      case 'pause':
        await pauseQueue(queueName)
        return NextResponse.json({ success: true, action: 'paused' })

      case 'resume':
        await resumeQueue(queueName)
        return NextResponse.json({ success: true, action: 'resumed' })

      case 'drain':
        await drainQueue(queueName)
        return NextResponse.json({ success: true, action: 'drained' })

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use ?action=pause, ?action=resume, or ?action=drain' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('[api/jobs/[queueName]] POST Error:', error)
    return NextResponse.json(
      { error: 'Failed to perform action' },
      { status: 500 }
    )
  }
}
