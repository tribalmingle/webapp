/**
 * Debug user password
 */

import { MongoClient } from 'mongodb'
import bcrypt from 'bcryptjs'

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://tribalmingle_db_user:HZHOdN3Q71W82gAi@tribalmingle.ndfbmbt.mongodb.net/'
const MONGODB_DB = process.env.MONGODB_DB || 'tribalmingle'

async function debugUser() {
  const client = new MongoClient(MONGODB_URI)

  try {
    console.log('🔗 Connecting to MongoDB...')
    await client.connect()
    console.log('✅ Connected!\n')

    const db = client.db(MONGODB_DB)
    const usersCollection = db.collection('users')

    // Get the test user
    const user = await usersCollection.findOne({ email: 'test@tribalmingle.com' })

    if (!user) {
      console.log('❌ User not found')
      return
    }

    console.log('📋 User Found:')
    console.log('  Email:', user.email)
    console.log('  Password (hashed):', user.password)
    console.log()

    // Try to verify password
    const testPassword = 'password123'
    const isValid = await bcrypt.compare(testPassword, user.password)
    console.log(`✓ Password "${testPassword}" matches: ${isValid ? '✅ YES' : '❌ NO'}`)
    console.log()

    if (!isValid) {
      console.log('💡 Password mismatch. Let me hash the password and update the user...')
      const salt = await bcrypt.genSalt(10)
      const hashedPassword = await bcrypt.hash(testPassword, salt)
      
      console.log('  New hashed password:', hashedPassword)
      console.log()

      // Update the user with the new hashed password
      const result = await usersCollection.updateOne(
        { email: 'test@tribalmingle.com' },
        { $set: { password: hashedPassword } }
      )

      console.log('✅ User password updated!')
      console.log('  Modified count:', result.modifiedCount)
      console.log()
      console.log('🎉 Now you can login with:')
      console.log('  Email: test@tribalmingle.com')
      console.log('  Password: password123')
    }
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  } finally {
    await client.close()
    console.log('\n🔌 Connection closed.')
  }
}

debugUser()
