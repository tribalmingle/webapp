import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { getCollection } from '@/lib/db/mongodb'

type RouteParams = {
  params: Promise<{ registrationId: string }>
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { registrationId } = await params
    const registrations = await getCollection('event_registrations')
    
    await registrations.updateOne(
      { _id: new ObjectId(registrationId) },
      { 
        $set: { 
          checkedInAt: new Date(),
          status: 'confirmed',
        },
      }
    )
    
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
