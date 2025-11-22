import { NextResponse } from 'next/server'
import { getMongoDb } from '@/lib/mongodb'
import jwt from 'jsonwebtoken'

// POST - Block a user
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { token, blockedUserEmail } = body

    if (!token || !blockedUserEmail) {
      return NextResponse.json(
        { success: false, message: 'Token and blocked user email are required' },
        { status: 400 }
      )
    }

    // Verify token and get current user
    let currentUserEmail: string
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any
      currentUserEmail = decoded.email
    } catch (error) {
      return NextResponse.json(
        { success: false, message: 'Invalid token' },
        { status: 401 }
      )
    }

    const db = await getMongoDb()

    // Check if block already exists
    const existingBlock = await db.collection('blocks').findOne({
      blockerEmail: currentUserEmail,
      blockedEmail: blockedUserEmail
    })

    if (existingBlock) {
      return NextResponse.json({
        success: false,
        message: 'User is already blocked'
      })
    }

    // Create block record
    await db.collection('blocks').insertOne({
      blockerEmail: currentUserEmail,
      blockedEmail: blockedUserEmail,
      blockedAt: new Date()
    })

    return NextResponse.json({
      success: true,
      message: 'User blocked successfully'
    })
  } catch (error) {
    console.error('Error blocking user:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// DELETE - Unblock a user
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')
    const blockedUserEmail = searchParams.get('blockedUserEmail')

    if (!token || !blockedUserEmail) {
      return NextResponse.json(
        { success: false, message: 'Token and blocked user email are required' },
        { status: 400 }
      )
    }

    // Verify token and get current user
    let currentUserEmail: string
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any
      currentUserEmail = decoded.email
    } catch (error) {
      return NextResponse.json(
        { success: false, message: 'Invalid token' },
        { status: 401 }
      )
    }

    const db = await getMongoDb()

    // Remove block record
    const result = await db.collection('blocks').deleteOne({
      blockerEmail: currentUserEmail,
      blockedEmail: blockedUserEmail
    })

    if (result.deletedCount === 0) {
      return NextResponse.json({
        success: false,
        message: 'Block not found'
      })
    }

    return NextResponse.json({
      success: true,
      message: 'User unblocked successfully'
    })
  } catch (error) {
    console.error('Error unblocking user:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// GET - Get list of blocked users
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Token is required' },
        { status: 400 }
      )
    }

    // Verify token and get current user
    let currentUserEmail: string
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any
      currentUserEmail = decoded.email
    } catch (error) {
      return NextResponse.json(
        { success: false, message: 'Invalid token' },
        { status: 401 }
      )
    }

    const db = await getMongoDb()

    // Get all users I blocked
    const blocks = await db
      .collection('blocks')
      .find({ blockerEmail: currentUserEmail })
      .toArray()

    const blockedEmails = blocks.map(block => block.blockedEmail)

    // Get user details for blocked users
    const blockedUsers = await db
      .collection('users')
      .find({ email: { $in: blockedEmails } })
      .project({
        password: 0,
        token: 0
      })
      .toArray()

    return NextResponse.json({
      success: true,
      count: blockedUsers.length,
      blockedUsers
    })
  } catch (error) {
    console.error('Error getting blocked users:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
