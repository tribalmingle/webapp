import { NextRequest, NextResponse } from 'next/server'
import { getMongoDb } from '@/lib/mongodb'
import { getCurrentUser } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const userPayload = await getCurrentUser()
    
    if (!userPayload) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { plan } = body

    if (!plan || !['free', 'monthly', '3-months', '6-months'].includes(plan)) {
      return NextResponse.json(
        { success: false, message: 'Invalid plan selected' },
        { status: 400 }
      )
    }

    const db = await getMongoDb()
    const usersCollection = db.collection('users')

    const result = await usersCollection.updateOne(
      { email: userPayload.email },
      { 
        $set: { 
          subscriptionPlan: plan,
          updatedAt: new Date()
        } 
      }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      )
    }

    // Fetch updated user
    const updatedUser = await usersCollection.findOne({ email: userPayload.email })
    if (!updatedUser) {
      return NextResponse.json(
        { success: false, message: 'Error fetching updated user' },
        { status: 500 }
      )
    }

    // Remove password from response
    const { password, ...userWithoutPassword } = updatedUser as any

    return NextResponse.json({
      success: true,
      message: 'Subscription updated successfully',
      user: userWithoutPassword
    })
  } catch (error) {
    console.error('Subscription update error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
