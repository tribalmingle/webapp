import { getQueue, QueueNames } from '@/lib/jobs/queue-setup'

export type PushEventType = 'like' | 'match' | 'message'

export type PushEventJob = {
  type: PushEventType
  recipientUserId: string
  senderUserId: string
  senderName: string
  senderPhoto?: string
  messagePreview?: string
  threadId?: string
}

export const enqueuePushEvent = async (job: PushEventJob) => {
  const queue = getQueue(QueueNames.PUSH_EVENTS)
  await queue.add('push-event', job, {
    attempts: 5,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: true,
    removeOnFail: false,
  })
}
