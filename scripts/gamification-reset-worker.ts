import { getMongoDb } from '@/lib/mongodb'

// Nightly reset for daily quests (sets progress back to 0 if not claimed)
async function resetDailyQuests() {
  const db = await getMongoDb()
  const collection = db.collection('user_quests')
  const dailyQuestIds = ['daily_first_message', 'daily_rsvp_event']
  await collection.updateMany(
    { questId: { $in: dailyQuestIds } },
    { $set: { progress: 0 }, $unset: { completedAt: '', claimedAt: '' } },
  )
  console.info('[gamification-reset] daily quests reset')
}

async function main() {
  await resetDailyQuests()
}

main().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1) })
