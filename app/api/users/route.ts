import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'

// Example User type
interface User {
  email: string
  name: string
  age: number
  tribe?: string
  createdAt: Date
}

// GET - Fetch all users
export async function GET() {
  try {
    const client = await clientPromise
    const db = client.db(process.env.MONGODB_DB || 'tribalmingle')
    const users = await db.collection<User>('users').find({}).limit(10).toArray()
    
    return NextResponse.json({
      success: true,
      count: users.length,
      users,
    })
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// POST - Create a new user
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const client = await clientPromise
    const db = client.db(process.env.MONGODB_DB || 'tribalmingle')
    
    const user: User = {
      ...body,
      createdAt: new Date(),
    }
    
    const result = await db.collection('users').insertOne(user)
    
    return NextResponse.json({
      success: true,
      message: 'User created successfully',
      userId: result.insertedId,
    })
  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
