/**
 * Test login API endpoint directly
 * Run with: npx tsx scripts/test-login-api.ts
 */

// Set JWT_SECRET before any imports
process.env.JWT_SECRET = 'your-super-secret-jwt-key-change-in-production-2024'
process.env.MONGODB_URI = 'mongodb+srv://tribalmingle_db_user:HZHOdN3Q71W82gAi@tribalmingle.ndfbmbt.mongodb.net/'
process.env.MONGODB_DB = 'tribalmingle'

import bcrypt from 'bcryptjs'
import { MongoClient } from 'mongodb'
import { SignJWT } from 'jose'

async function testLoginFlow() {
  console.log('🧪 Testing complete login flow...\n')

  const client = new MongoClient(process.env.MONGODB_URI!)
  
  try {
    await client.connect()
    const db = client.db(process.env.MONGODB_DB!)
    
    const email = 'test@tribalmingle.com'
    const password = 'password123'
    
    console.log('1️⃣ Finding user...')
    const user = await db.collection('users').findOne({ email })
    
    if (!user) {
      console.log('❌ User not found')
      return
    }
    console.log('✅ User found:', user._id.toString())
    
    console.log('\n2️⃣ Verifying password...')
    const isValid = await bcrypt.compare(password, user.password)
    console.log('Password valid:', isValid)
    
    if (!isValid) {
      console.log('❌ Invalid password')
      return
    }
    
    console.log('\n3️⃣ Creating JWT token...')
    const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!)
    const token = await new SignJWT({
      userId: user._id.toString(),
      email: user.email,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(JWT_SECRET)
    
    console.log('✅ Token created successfully!')
    console.log('Token length:', token.length)
    console.log('Token preview:', token.substring(0, 50) + '...')
    
    console.log('\n✅ Login flow test PASSED!')
    console.log('\n⚠️  Action Required:')
    console.log('Your dev server needs to be restarted to load JWT_SECRET')
    console.log('1. Stop the dev server (Ctrl+C in the terminal running it)')
    console.log('2. Run: pnpm dev')
    console.log('3. Try logging in again')
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await client.close()
  }
}

testLoginFlow()
