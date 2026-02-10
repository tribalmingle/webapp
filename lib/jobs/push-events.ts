import { Worker } from 'bullmq'
import { redisConnection, QueueNames } from './queue-setup'
import { sendPushToUser } from '@/lib/push/send-push'
import type { PushEventJob } from '@/lib/services/push-events-service'

export const createPushEventsWorker = () => {
  return new Worker<PushEventJob>(
    QueueNames.PUSH_EVENTS,
    async (job) => {
      const { type, recipientUserId, senderUserId, senderName, senderPhoto, messagePreview, threadId } = job.data

      if (type === 'message') {
        await sendPushToUser(recipientUserId, {
          title: senderName,
          body: messagePreview || 'New message',
          category: 'message',
          data: {
            type: 'message',
            senderUserId,
            threadId: threadId || senderUserId,
          },
          deepLink: `/(tabs)/chat/[id]?id=${encodeURIComponent(threadId || senderUserId)}`,
        })
        return
      }

      if (type === 'like') {
        await sendPushToUser(recipientUserId, {
          title: 'New like',
          body: `${senderName} liked your profile`,
          category: 'like',
          data: {
            type: 'like',
            senderUserId,
          },
          deepLink: '/(tabs)/matches',
        })
        return
      }

      await sendPushToUser(recipientUserId, {
        title: 'It’s a match',
        body: `You and ${senderName} matched`,
        category: 'match',
        data: {
          type: 'match',
          senderUserId,
          senderPhoto: senderPhoto || '',
        },
        deepLink: '/(tabs)/matches',
      })
    },
    { connection: redisConnection }
  )
}
