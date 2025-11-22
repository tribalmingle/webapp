import { NextRequest, NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

import { ensureAdminRequest } from '@/lib/admin/auth'

// GET /api/admin/testimonials
export async function GET(request: NextRequest) {
  try {
    const auth = ensureAdminRequest(request)
    if ('response' in auth) {
      return auth.response
    }

    const client = await clientPromise
    const db = client.db(process.env.MONGODB_DB || 'tribalmingle')
    const testimonials = db.collection('testimonials')

    const docs = await testimonials
      .find({})
      .sort({ createdAt: -1 })
      .limit(200)
      .toArray()

    return NextResponse.json({ success: true, testimonials: docs })
  } catch (error) {
    console.error('Error fetching admin testimonials:', error)
    return NextResponse.json({ success: false, message: 'Failed to fetch testimonials' }, { status: 500 })
  }
}

// POST /api/admin/testimonials
export async function POST(request: NextRequest) {
  try {
    const auth = ensureAdminRequest(request)
    if ('response' in auth) {
      return auth.response
    }

    const client = await clientPromise
    const db = client.db(process.env.MONGODB_DB || 'tribalmingle')
    const testimonials = db.collection('testimonials')

    const body = await request.json()

    // Approve / reject existing testimonial
    if (body.id && body.status) {
      const allowedStatuses = ['pending', 'approved', 'rejected']
      if (!allowedStatuses.includes(body.status)) {
        return NextResponse.json({ success: false, message: 'Invalid status' }, { status: 400 })
      }

      await testimonials.updateOne(
        { _id: new ObjectId(body.id) },
        {
          $set: {
            status: body.status,
            updatedAt: new Date()
          }
        }
      )

      return NextResponse.json({ success: true })
    }

    // Create admin-authored testimonial
    const { content, rating, name, age, city, country, tribe, profilePhoto } = body || {}

    if (!content || typeof content !== 'string' || content.trim().length < 20) {
      return NextResponse.json({ success: false, message: 'Please write at least 20 characters' }, { status: 400 })
    }

    if (!name || typeof name !== 'string') {
      return NextResponse.json({ success: false, message: 'Name is required' }, { status: 400 })
    }

    const numericRating = Number(rating) || 5
    const clampedRating = Math.max(1, Math.min(5, numericRating))

    const now = new Date()

    const doc = {
      sourceType: 'admin' as const,
      userId: null,
      userEmail: null,
      name,
      age: age || null,
      city: city || '',
      country: country || '',
      tribe: tribe || '',
      profilePhoto: profilePhoto || '',
      rating: clampedRating,
      content: content.trim(),
      status: 'approved',
      createdAt: now,
      updatedAt: now
    }

    const result = await testimonials.insertOne(doc)

    return NextResponse.json({ success: true, id: result.insertedId })
  } catch (error) {
    console.error('Error in admin testimonials POST:', error)
    return NextResponse.json({ success: false, message: 'Failed to process testimonial' }, { status: 500 })
  }
}
