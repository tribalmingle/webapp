import { NextRequest, NextResponse } from 'next/server'
import { getMongoDb } from '@/lib/mongodb'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const isValidEmail = (value: string) => /\S+@\S+\.\S+/.test(value)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const name = String(body?.name || '').trim()
    const email = String(body?.email || '').trim().toLowerCase()
    const feedback = String(body?.feedback || '').trim()

    if (!name || !email || !feedback) {
      return NextResponse.json(
        { success: false, message: 'Name, email, and feedback are required.' },
        { status: 400 }
      )
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { success: false, message: 'Please provide a valid email address.' },
        { status: 400 }
      )
    }

    const db = await getMongoDb()
    const feedbackCollection = db.collection('feedback')

    const now = new Date()
    await feedbackCollection.insertOne({
      name,
      email,
      feedback,
      status: 'new',
      createdAt: now,
      updatedAt: now,
      userAgent: request.headers.get('user-agent') || undefined,
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
    })

    return NextResponse.json({ success: true, message: 'Feedback received. Thank you!' })
  } catch (error) {
    console.error('Feedback submission failed:', error)
    return NextResponse.json(
      { success: false, message: 'Unable to submit feedback right now.' },
      { status: 500 }
    )
  }
}
