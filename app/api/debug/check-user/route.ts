import { NextResponse } from 'next/server'
import { getMongoDb } from '@/lib/mongodb'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email') || 'daniel@gmail.com'
    
    const db = await getMongoDb()
    const usersCollection = db.collection('users')
    
    // Get all users
    const allUsers = await usersCollection.find({}, { 
      projection: { email: 1, name: 1, _id: 0 } 
    }).toArray()
    
    // Check for specific user
    const user = await usersCollection.findOne({ 
      email: { $regex: new RegExp(`^${email}$`, 'i') } 
    }, {
      projection: { password: 0 }
    })
    
    return NextResponse.json({
      success: true,
      searchedEmail: email,
      userExists: !!user,
      user: user,
      totalUsers: allUsers.length,
      allUsers: allUsers
    })
  } catch (error) {
    console.error('Error checking user:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
