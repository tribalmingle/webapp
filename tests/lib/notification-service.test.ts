import { ObjectId } from 'mongodb'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { NotificationService } from '@/lib/services/notification-service'
import { getMongoDb } from '@/lib/mongodb'
import { sendOneSignalNotification } from '@/lib/vendors/onesignal-client'

vi.mock('@/lib/mongodb', () => ({
  getMongoDb: vi.fn(),
}))

vi.mock('@/lib/services/analytics-service', () => ({
  AnalyticsService: { track: vi.fn() },
}))

vi.mock('@/lib/vendors/onesignal-client', () => ({
  sendOneSignalNotification: vi.fn(),
}))

describe('NotificationService.sendEventReminder', () => {
  let notificationsCollection: {
    findOne: ReturnType<typeof vi.fn>
    insertOne: ReturnType<typeof vi.fn>
    updateOne: ReturnType<typeof vi.fn>
  }

  const userId = new ObjectId().toHexString()
  const reminderPayload = {
    userId,
    reminderWindow: '24h' as const,
    events: [
      {
        id: new ObjectId().toHexString(),
        slug: 'culture-night',
        title: 'Culture Night',
        startAt: new Date().toISOString(),
      },
    ],
  }

  beforeEach(() => {
    vi.clearAllMocks()
    notificationsCollection = {
      findOne: vi.fn(),
      insertOne: vi.fn(),
      updateOne: vi.fn(),
    }

    const db = {
      collection: vi.fn(() => notificationsCollection),
    }

    vi.mocked(getMongoDb).mockResolvedValue(db as any)
    notificationsCollection.insertOne.mockResolvedValue({ insertedId: new ObjectId() })
    notificationsCollection.updateOne.mockResolvedValue({ acknowledged: true })
    vi.mocked(sendOneSignalNotification).mockResolvedValue({ status: 'sent', id: 'abc' })
  })

  it('persists reminder and calls OneSignal', async () => {
    notificationsCollection.findOne.mockResolvedValue(null)
    await NotificationService.sendEventReminder(reminderPayload)

    expect(notificationsCollection.insertOne).toHaveBeenCalled()
    expect(sendOneSignalNotification).toHaveBeenCalledWith(
      expect.objectContaining({ heading: expect.any(String), userIds: [userId] }),
    )
  })

  it('dedupes existing reminder', async () => {
    notificationsCollection.findOne.mockResolvedValue({ _id: new ObjectId() })

    await NotificationService.sendEventReminder(reminderPayload)

    expect(notificationsCollection.insertOne).not.toHaveBeenCalled()
    expect(sendOneSignalNotification).not.toHaveBeenCalled()
    expect(notificationsCollection.findOne).toHaveBeenCalledTimes(1)
  })
})
