import { withSpan } from '@/lib/observability/tracing'
import { getMongoDb } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export type QuestDefinition = {
  id: string
  title: string
  description: string
  xp: number
  type: 'daily' | 'weekly' | 'one_time'
  requirements: { eventType?: string; count?: number }
}

export type UserQuestState = {
  userId: ObjectId
  questId: string
  progress: number
  completedAt?: Date
  claimedAt?: Date
  createdAt: Date
  updatedAt: Date
}

const QUESTS: QuestDefinition[] = [
  { id: 'daily_first_message', title: 'Break the Ice', description: 'Send your first message today', xp: 25, type: 'daily', requirements: { eventType: 'chat.sent', count: 1 } },
  { id: 'daily_rsvp_event', title: 'Show Up', description: 'RSVP to an event today', xp: 35, type: 'daily', requirements: { eventType: 'events.rsvp', count: 1 } },
  { id: 'weekly_create_post', title: 'Join the Conversation', description: 'Create 3 community posts this week', xp: 120, type: 'weekly', requirements: { eventType: 'community_post_created', count: 3 } },
]

export class GamificationService {
  static listQuests(userId: string) {
    return withSpan('gamification.listQuests', async () => {
      const db = await getMongoDb()
      const collection = db.collection<UserQuestState>('user_quests')
      const states = await collection.find({ userId: new ObjectId(userId) }).toArray()
      const stateMap = new Map(states.map((s) => [s.questId, s]))
      return QUESTS.map((q) => ({
        id: q.id,
        title: q.title,
        description: q.description,
        xp: q.xp,
        type: q.type,
        progress: stateMap.get(q.id)?.progress ?? 0,
        target: q.requirements.count ?? 1,
        completed: Boolean(stateMap.get(q.id)?.completedAt),
        claimed: Boolean(stateMap.get(q.id)?.claimedAt),
      }))
    }, { userId })
  }

  static recordEvent(userId: string, eventType: string) {
    return withSpan('gamification.recordEvent', async () => {
      const db = await getMongoDb()
      const collection = db.collection<UserQuestState>('user_quests')
      const userObjectId = new ObjectId(userId)
      const matched = QUESTS.filter((q) => q.requirements.eventType === eventType)
      const now = new Date()
      for (const quest of matched) {
        const existing = await collection.findOne({ userId: userObjectId, questId: quest.id })
        const nextProgress = Math.min((existing?.progress ?? 0) + 1, quest.requirements.count ?? 1)
        const completedAt = nextProgress >= (quest.requirements.count ?? 1) ? now : existing?.completedAt
        await collection.updateOne(
          { userId: userObjectId, questId: quest.id },
          {
            $set: {
              progress: nextProgress,
              updatedAt: now,
              completedAt,
            },
            $setOnInsert: { createdAt: now },
          },
          { upsert: true },
        )
      }
    }, { userId, eventType })
  }

  static claimQuest(userId: string, questId: string) {
    return withSpan('gamification.claimQuest', async () => {
      const quest = QUESTS.find((q) => q.id === questId)
      if (!quest) throw new Error('Quest not found')
      const db = await getMongoDb()
      const collection = db.collection<UserQuestState>('user_quests')
      const userObjectId = new ObjectId(userId)
      const state = await collection.findOne({ userId: userObjectId, questId })
      if (!state || !state.completedAt) throw new Error('Quest not complete')
      if (state.claimedAt) return { success: true, xpAwarded: 0, alreadyClaimed: true }
      const now = new Date()
      await collection.updateOne({ _id: state._id }, { $set: { claimedAt: now, updatedAt: now } })
      // TODO: integrate with wallet/XP balance service
      return { success: true, xpAwarded: quest.xp }
    }, { userId, questId })
  }
}

export function listQuestDefinitions() {
  return QUESTS
}