/**
 * Debug login attempt
 * Run with: npx tsx scripts/debug-login.ts
 */

import bcrypt from 'bcryptjs'
import { MongoClient } from 'mongodb'

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://tribalmingle_db_user:HZHOdN3Q71W82gAi@tribalmingle.ndfbmbt.mongodb.net/'
const MONGODB_DB = process.env.MONGODB_DB || 'tribalmingle'

async function debugLogin() {
  console.log('🔍 Debugging login process...\n')

  const client = new MongoClient(MONGODB_URI)
  
  try {
    await client.connect()
    console.log('✅ Connected to MongoDB\n')
    
    const db = client.db(MONGODB_DB)
    const usersCollection = db.collection('users')
    
    const testEmail = 'test@tribalmingle.com'
    const testPassword = 'password123'
    
    console.log('1️⃣ Searching for user with email:', testEmail)
    const user = await usersCollection.findOne({ email: testEmail })
    
    if (!user) {
      console.log('❌ User not found!')
      return
    }
    
    console.log('✅ User found!')
    console.log('User ID:', user._id.toString())
    console.log('Email:', user.email)
    console.log('Has password:', !!user.password)
    console.log('Password hash length:', user.password?.length)
    
    console.log('\n2️⃣ Testing password comparison...')
    const isValid = await bcrypt.compare(testPassword, user.password)
    console.log('Password valid:', isValid)
    
    if (!isValid) {
      console.log('\n❌ Password does not match!')
      console.log('Let me re-hash the password...')
      
      const newHash = await bcrypt.hash(testPassword, 10)
      await usersCollection.updateOne(
        { email: testEmail },
        { $set: { password: newHash, updatedAt: new Date() } }
      )
      
      console.log('✅ Password updated!')
      
      // Test again
      const newIsValid = await bcrypt.compare(testPassword, newHash)
      console.log('New password valid:', newIsValid)
    }
    
    console.log('\n3️⃣ Checking JWT_SECRET...')
    console.log('JWT_SECRET set:', !!process.env.JWT_SECRET)
    console.log('JWT_SECRET length:', process.env.JWT_SECRET?.length)
    
    if (!process.env.JWT_SECRET) {
      console.log('⚠️  JWT_SECRET not set in environment!')
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
    throw error
  } finally {
    await client.close()
    console.log('\n🔌 Database connection closed')
  }
}

debugLogin()
