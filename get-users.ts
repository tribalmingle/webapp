/**
 * Get list of registered users
 */

import { MongoClient } from 'mongodb'

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://tribalmingle_db_user:HZHOdN3Q71W82gAi@tribalmingle.ndfbmbt.mongodb.net/'
const MONGODB_DB = process.env.MONGODB_DB || 'tribalmingle'

async function getRegisteredUsers() {
  const client = new MongoClient(MONGODB_URI)

  try {
    console.log('🔗 Connecting to MongoDB...')
    await client.connect()
    console.log('✅ Connected!\n')

    const db = client.db(MONGODB_DB)
    const usersCollection = db.collection('users')

    // Get all users with relevant fields
    const users = await usersCollection
      .find({})
      .project({
        _id: 1,
        email: 1,
        first_name: 1,
        last_name: 1,
        phone: 1,
        created_at: 1,
        verified: 1,
      })
      .sort({ created_at: -1 })
      .toArray()

    console.log(`📊 Total Registered Users: ${users.length}\n`)
    console.log('=' .repeat(100))

    if (users.length === 0) {
      console.log('No users found.')
    } else {
      // Display in table format
      users.forEach((user, index) => {
        console.log(`\n${index + 1}. ${user.first_name || '?'} ${user.last_name || '?'}`)
        console.log(`   Email: ${user.email}`)
        console.log(`   Phone: ${user.phone || 'N/A'}`)
        console.log(`   Verified: ${user.verified ? '✅ Yes' : '❌ No'}`)
        console.log(`   Created: ${new Date(user.created_at).toLocaleString()}`)
        console.log(`   ID: ${user._id}`)
      })
    }

    console.log('\n' + '='.repeat(100))
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  } finally {
    await client.close()
    console.log('\n🔌 Connection closed.')
  }
}

getRegisteredUsers()
