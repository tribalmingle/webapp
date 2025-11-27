import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { getCollection } from '@/lib/db/mongodb'
import { COLLECTIONS } from '@/lib/db/collections'

type RouteParams = {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const collection = await getCollection(COLLECTIONS.TRUST_REPORTS)
    const report = await collection.findOne({ _id: new ObjectId(id) })

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }

    return NextResponse.json(report)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const body = await request.json()
    const collection = await getCollection(COLLECTIONS.TRUST_REPORTS)

    const update: any = {}
    if (body.status) update.status = body.status
    if (body.assignedTo) update.assignedTo = body.assignedTo
    if (body.priority) update.priority = body.priority
    if (body.status === 'resolved') update.resolvedAt = new Date()

    await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: update }
    )

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
