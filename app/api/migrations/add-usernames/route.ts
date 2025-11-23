import { NextResponse } from 'next/server'
import { getMongoDb } from '@/lib/mongodb'
import { generateUniqueUsername } from '@/lib/utils/username'

/**
 * Migration endpoint to add usernames to existing users
 * GET /api/migrations/add-usernames
 * 
 * This should only be run once after deploying the username feature
 */
export async function GET() {
  try {
    const db = await getMongoDb()
    const usersCollection = db.collection('users')

    // Find all users without a username
    const usersWithoutUsername = await usersCollection.find({ 
      username: { $exists: false } 
    }).toArray()

    console.log(`Found ${usersWithoutUsername.length} users without usernames`)

    const updates: Array<{ email?: string; name?: string; username: string }> = []

    for (const user of usersWithoutUsername) {
      // Generate unique username
      const username = await generateUniqueUsername(user.name as string, db)

      // Update user with username
      await usersCollection.updateOne(
        { _id: user._id },
        { $set: { username } }
      )

      updates.push({
        email: user.email,
        name: user.name,
        username
      })

      console.log(`Updated user ${user.email} with username: ${username}`)
    }

    return NextResponse.json({
      success: true,
      message: `Successfully added usernames to ${updates.length} users`,
      updates
    })
  } catch (error) {
    console.error('Migration error:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Migration failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
