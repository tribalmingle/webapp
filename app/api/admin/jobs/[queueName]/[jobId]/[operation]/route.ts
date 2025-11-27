/**
 * API: Individual job operations (retry/remove)
 */

import { NextRequest, NextResponse } from 'next/server'
import { getQueue, type QueueName, QueueNames } from '@/lib/jobs/queue-setup'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ queueName: string; jobId: string; operation: string }> }
) {
  try {
    const resolvedParams = await params
    const queueName = resolvedParams.queueName as QueueName
    const jobId = resolvedParams.jobId
    const operation = resolvedParams.operation

    // Validate queue name
    if (!Object.values(QueueNames).includes(queueName)) {
      return NextResponse.json(
        { error: 'Invalid queue name' },
        { status: 400 }
      )
    }

    const queue = getQueue(queueName)
    const job = await queue.getJob(jobId)

    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      )
    }

    if (operation === 'retry') {
      await job.retry()
      return NextResponse.json({ success: true, action: 'retried' })
    } else {
      return NextResponse.json(
        { error: 'Invalid operation' },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('[api/jobs/[queueName]/[jobId]/[operation]] Error:', error)
    return NextResponse.json(
      { error: 'Failed to perform operation' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ queueName: string; jobId: string }> }
) {
  try {
    const resolvedParams = await params
    const queueName = resolvedParams.queueName as QueueName
    const jobId = resolvedParams.jobId

    // Validate queue name
    if (!Object.values(QueueNames).includes(queueName)) {
      return NextResponse.json(
        { error: 'Invalid queue name' },
        { status: 400 }
      )
    }

    const queue = getQueue(queueName)
    const job = await queue.getJob(jobId)

    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      )
    }

    await job.remove()

    return NextResponse.json({ success: true, action: 'removed' })
  } catch (error) {
    console.error('[api/jobs/[queueName]/[jobId]] Error:', error)
    return NextResponse.json(
      { error: 'Failed to remove job' },
      { status: 500 }
    )
  }
}
