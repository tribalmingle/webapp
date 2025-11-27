import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { getCollection } from '@/lib/db/mongodb'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      title, 
      description, 
      startAt, 
      endAt, 
      timezone, 
      tribe, 
      tags, 
      location, 
      capacity,
      ticketing,
      hostUserIds,
      visibility,
      assets,
    } = body

    const events = await getCollection('events')
    const event = {
      title,
      description,
      slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      startAt: new Date(startAt),
      endAt: new Date(endAt),
      timezone: timezone || 'America/New_York',
      tribe,
      tags: tags || [],
      location: location || { type: 'virtual' },
      capacity: capacity || 100,
      ticketing: ticketing || { type: 'free' },
      hostUserIds: hostUserIds?.map((id: string) => new ObjectId(id)) || [],
      visibility: visibility || 'public',
      assets: assets || {},
      moderationState: 'published',
      waitlistEnabled: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await events.insertOne(event)
    return NextResponse.json({ eventId: result.insertedId.toString() })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status') || 'upcoming'
    
    const events = await getCollection('events')
    const now = new Date()
    
    let query: any = { moderationState: 'published' }
    
    if (status === 'upcoming') {
      query.startAt = { $gte: now }
    } else if (status === 'past') {
      query.endAt = { $lt: now }
    }
    
    const eventList = await events
      .find(query)
      .sort({ startAt: status === 'upcoming' ? 1 : -1 })
      .limit(50)
      .toArray()
    
    return NextResponse.json(eventList)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
