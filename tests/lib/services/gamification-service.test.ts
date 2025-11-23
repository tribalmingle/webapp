import { describe, it, expect } from 'vitest'
import { GamificationService } from '@/lib/services/gamification-service'
import { getMongoDb } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

describe('GamificationService', () => {
  const userId = new ObjectId().toHexString()

  it('lists quests', async () => {
    const quests = await GamificationService.listQuests(userId)
    expect(quests.length).toBeGreaterThan(0)
  })

  it('records events and progresses quest', async () => {
    await GamificationService.recordEvent(userId, 'chat.sent')
    const quests = await GamificationService.listQuests(userId)
    const daily = quests.find(q => q.id === 'daily_first_message')
    expect(daily?.progress).toBe(1)
  })

  it('claims completed quest', async () => {
    await GamificationService.recordEvent(userId, 'chat.sent')
    const result = await GamificationService.claimQuest(userId, 'daily_first_message')
    expect(result.success).toBe(true)
  })
})
