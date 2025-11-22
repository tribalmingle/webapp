import { NextRequest, NextResponse } from 'next/server'
import { getMongoDb } from '@/lib/mongodb'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params
    console.log('=== GET USER API DEBUG ===')
    console.log('Received userId (email):', userId)

    const db = await getMongoDb()
    const usersCollection = db.collection('users')

    // Check all users to see what emails exist
    const allUsers = await usersCollection.find({}, { projection: { email: 1, name: 1 } }).limit(10).toArray()
    console.log('Sample users in database:', allUsers)

    // Try case-insensitive search first
    const user = await usersCollection.findOne({ 
      email: { $regex: new RegExp(`^${userId}$`, 'i') } 
    })
    console.log('Found user:', user ? 'YES' : 'NO')
    if (user) {
      console.log('User found with email:', (user as any).email)
    }

    if (!user) {
      console.log('User not found with email:', userId)
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      )
    }

    // Remove sensitive information
    const { password, ...userWithoutPassword } = user as any

    return NextResponse.json({
      success: true,
      user: {
        email: userWithoutPassword.email,
        name: userWithoutPassword.name,
        username: userWithoutPassword.username,
        age: userWithoutPassword.age,
        city: userWithoutPassword.city,
        profilePhoto: userWithoutPassword.profilePhotos?.[0] || userWithoutPassword.profilePhoto
      }
    })
  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
