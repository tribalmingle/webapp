import { NextRequest, NextResponse } from 'next/server'
import { ensureAdminRequest } from '@/lib/admin/auth'
import { getMongoDb } from '@/lib/mongodb'

export async function GET(req: NextRequest) {
  const auth = ensureAdminRequest(req)
  if ('response' in auth) {
    return auth.response
  }

  try {
    const db = await getMongoDb()
    const reportsCollection = db.collection('reports')

    // Get all reports
    const reports = await reportsCollection
      .find({})
      .sort({ createdAt: -1 })
      .toArray()

    const enrichedReports = reports.map((report: any) => ({
      ...report,
      _id: report._id.toString()
    }))

    return NextResponse.json({ success: true, reports: enrichedReports })
  } catch (error) {
    console.error('Error fetching reports:', error)
    // Return empty array if collection doesn't exist yet
    return NextResponse.json({ success: true, reports: [] })
  }
}
