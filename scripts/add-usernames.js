/**
 * Migration script to add username field to existing users
 * Run this once to update all users who don't have a username
 * 
 * Usage: node scripts/add-usernames.js
 */

const { MongoClient } = require('mongodb')

async function addUsernamesToExistingUsers() {
  const uri = process.env.MONGODB_URI || 'your-mongodb-uri'
  const client = new MongoClient(uri)

  try {
    await client.connect()
    const db = client.db(process.env.MONGODB_DB || 'tribalmingle')
    const usersCollection = db.collection('users')

    // Find all users without a username
    const usersWithoutUsername = await usersCollection.find({ 
      username: { $exists: false } 
    }).toArray()

    console.log(`Found ${usersWithoutUsername.length} users without usernames`)

    for (const user of usersWithoutUsername) {
      // Generate username from first name + random number
      const firstName = user.name.trim().split(' ')[0].toLowerCase().replace(/[^a-z0-9]/g, '')
      let username = null
      let attempts = 0

      // Try to generate unique username
      while (!username && attempts < 10) {
        const randomNum = Math.floor(1000 + Math.random() * 9000)
        const testUsername = `${firstName}${randomNum}`
        
        // Check if username exists
        const existing = await usersCollection.findOne({ username: testUsername })
        if (!existing) {
          username = testUsername
        }
        attempts++
      }

      // Fallback to timestamp if needed
      if (!username) {
        const timestamp = Date.now().toString().slice(-6)
        username = `${firstName}${timestamp}`
      }

      // Update user with username
      await usersCollection.updateOne(
        { _id: user._id },
        { $set: { username } }
      )

      console.log(`Updated user ${user.email} with username: ${username}`)
    }

    console.log('Migration completed successfully!')
  } catch (error) {
    console.error('Migration error:', error)
  } finally {
    await client.close()
  }
}

addUsernamesToExistingUsers()
