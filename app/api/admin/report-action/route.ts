import { NextRequest, NextResponse } from 'next/server'
import { ensureAdminRequest } from '@/lib/admin/auth'
import { getMongoDb } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export async function POST(req: NextRequest) {
  const auth = ensureAdminRequest(req)
  if ('response' in auth) {
    return auth.response
  }

  try {
    const { reportId, action } = await req.json()

    if (!reportId || !action) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      )
    }

    const db = await getMongoDb()
    const reportsCollection = db.collection('reports')

    const newStatus = action === 'resolve' ? 'resolved' : 'dismissed'

    const result = await reportsCollection.updateOne(
      { _id: new ObjectId(reportId) },
      { $set: { status: newStatus, resolvedAt: new Date().toISOString() } }
    )

    if (result.modifiedCount === 0) {
      return NextResponse.json(
        { success: false, message: 'Report not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, message: `Report ${action}d successfully` })
  } catch (error) {
    console.error('Error performing report action:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to perform action' },
      { status: 500 }
    )
  }
}
