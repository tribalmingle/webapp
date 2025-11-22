import { NextRequest, NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { getCurrentUser } from '@/lib/auth'
import { ObjectId } from 'mongodb'

// GET /api/testimonials
export async function GET(request: NextRequest) {
  try {
    const client = await clientPromise
    const db = client.db(process.env.MONGODB_DB || 'tribalmingle')
    const testimonials = db.collection('testimonials')

    const { searchParams } = new URL(request.url)
    const limitParam = searchParams.get('limit')
    const limit = Math.min(parseInt(limitParam || '6', 10) || 6, 20)

    const pipeline: any[] = [
      { $match: { status: 'approved' } },
      { $sample: { size: limit } }
    ]

    const docs = await testimonials.aggregate(pipeline).toArray()

    return NextResponse.json({ success: true, testimonials: docs })
  } catch (error) {
    console.error('Error fetching testimonials:', error)
    return NextResponse.json({ success: false, message: 'Failed to fetch testimonials' }, { status: 500 })
  }
}

// POST /api/testimonials - premium user submission
export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ success: false, message: 'Not authenticated' }, { status: 401 })
    }

    const client = await clientPromise
    const db = client.db(process.env.MONGODB_DB || 'tribalmingle')
    const users = db.collection('users')
    const testimonials = db.collection('testimonials')

    const userDoc = await users.findOne({ _id: new ObjectId(currentUser.userId) })
    if (!userDoc) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 })
    }

    const subscriptionPlan = (userDoc as any).subscriptionPlan || 'free'
    if (subscriptionPlan === 'free') {
      return NextResponse.json({ success: false, message: 'Only paid members can submit testimonials' }, { status: 403 })
    }

    const body = await request.json()
    const { content, rating } = body || {}

    if (!content || typeof content !== 'string' || content.trim().length < 20) {
      return NextResponse.json({ success: false, message: 'Please write at least 20 characters' }, { status: 400 })
    }

    const numericRating = Number(rating) || 5
    const clampedRating = Math.max(1, Math.min(5, numericRating))

    const now = new Date()

    const doc = {
      sourceType: 'user' as const,
      userId: userDoc._id,
      userEmail: userDoc.email,
      name: userDoc.name,
      age: (userDoc as any).age || null,
      city: (userDoc as any).city || '',
      country: (userDoc as any).country || '',
      tribe: (userDoc as any).tribe || '',
      profilePhoto: (userDoc as any).profilePhoto || '',
      rating: clampedRating,
      content: content.trim(),
      status: 'pending',
      createdAt: now,
      updatedAt: now
    }

    const result = await testimonials.insertOne(doc)

    await users.updateOne(
      { _id: userDoc._id },
      {
        $set: {
          hasSubmittedTestimonial: true,
          lastTestimonialPromptAt: now
        }
      }
    )

    return NextResponse.json({ success: true, id: result.insertedId })
  } catch (error) {
    console.error('Error creating testimonial:', error)
    return NextResponse.json({ success: false, message: 'Failed to submit testimonial' }, { status: 500 })
  }
}
