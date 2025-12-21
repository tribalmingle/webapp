// Test script to backdate a user for testing registration reminders
const { MongoClient } = require('mongodb')

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://tribalmingle_db_user:HZHOdN3Q71W82gAi@tribalmingle.ndfbmbt.mongodb.net/'
const MONGODB_DB = process.env.MONGODB_DB || 'tribalmingle'

async function backdateLatestUser() {
  let client
  try {
    client = await MongoClient.connect(MONGODB_URI)
    const db = client.db(MONGODB_DB)

    // Find the most recent user
    const latestUser = await db.collection('users')
      .find({ registrationComplete: false })
      .sort({ createdAt: -1 })
      .limit(1)
      .toArray()

    if (latestUser.length === 0) {
      console.log('❌ No incomplete users found. Create a test user first at http://localhost:3000/sign-up')
      process.exit(1)
    }

    const user = latestUser[0]
    console.log(`\n📧 Found user: ${user.email}`)
    console.log(`🕐 Current createdAt: ${user.createdAt}`)

    // Backdate to 6 minutes ago (more than 5 minute threshold)
    const sixMinutesAgo = new Date(Date.now() - 6 * 60 * 1000)
    const sixteenMinutesAgo = new Date(Date.now() - 16 * 60 * 1000)

    const result = await db.collection('users').updateOne(
      { _id: user._id },
      {
        $set: {
          createdAt: sixMinutesAgo,
          updatedAt: sixteenMinutesAgo,
          registrationReminderSent: false // Reset in case already sent
        }
      }
    )

    if (result.modifiedCount > 0) {
      console.log(`✅ Successfully backdated user to 6 minutes ago`)
      console.log(`🕐 New createdAt: ${sixMinutesAgo}`)
      console.log(`\n🚀 Now run the cron job:`)
      console.log(`curl -X POST http://localhost:3000/api/cron/send-registration-reminders -H "Authorization: Bearer ${process.env.CRON_SECRET}"`)
    } else {
      console.log('❌ Failed to update user')
    }

    await client.close()
    process.exit(0)
  } catch (error) {
    console.error('❌ Error:', error.message)
    if (client) await client.close()
    process.exit(1)
  }
}

backdateLatestUser()
