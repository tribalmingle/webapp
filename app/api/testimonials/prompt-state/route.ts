import { NextRequest, NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { getCurrentUser } from '@/lib/auth'
import { ObjectId } from 'mongodb'

// GET /api/testimonials/prompt-state
export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ success: false, showPrompt: false }, { status: 200 })
    }

    const client = await clientPromise
    const db = client.db(process.env.MONGODB_DB || 'tribalmingle')
    const users = db.collection('users')

    const userDoc = await users.findOne({ _id: new ObjectId(currentUser.userId) })
    if (!userDoc) {
      return NextResponse.json({ success: false, showPrompt: false }, { status: 200 })
    }

    const subscriptionPlan = (userDoc as any).subscriptionPlan || 'free'

    // Only paid users should see testimonial prompts
    if (subscriptionPlan === 'free') {
      return NextResponse.json({ success: true, showPrompt: false }, { status: 200 })
    }

    const hasSubmitted = !!(userDoc as any).hasSubmittedTestimonial
    if (hasSubmitted) {
      return NextResponse.json({ success: true, showPrompt: false }, { status: 200 })
    }

    const lastPromptAt = (userDoc as any).lastTestimonialPromptAt
    const now = new Date()

    if (!lastPromptAt) {
      return NextResponse.json({ success: true, showPrompt: true }, { status: 200 })
    }

    const last = new Date(lastPromptAt)
    const diffMs = now.getTime() - last.getTime()
    const diffHours = diffMs / (1000 * 60 * 60)

    const showPrompt = diffHours >= 48

    return NextResponse.json({ success: true, showPrompt }, { status: 200 })
  } catch (error) {
    console.error('Error getting testimonial prompt state:', error)
    return NextResponse.json({ success: false, showPrompt: false }, { status: 500 })
  }
}

// POST /api/testimonials/prompt-state - dismiss prompt
export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ success: false, message: 'Not authenticated' }, { status: 401 })
    }

    const client = await clientPromise
    const db = client.db(process.env.MONGODB_DB || 'tribalmingle')
    const users = db.collection('users')

    const now = new Date()

    await users.updateOne(
      { _id: new ObjectId(currentUser.userId) },
      {
        $set: {
          lastTestimonialPromptAt: now
        }
      }
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating testimonial prompt state:', error)
    return NextResponse.json({ success: false, message: 'Failed to update prompt state' }, { status: 500 })
  }
}
