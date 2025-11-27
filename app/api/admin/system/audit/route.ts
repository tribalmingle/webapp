import { NextResponse } from 'next/server'
import { getCollection } from '@/lib/db/mongodb'
import { COLLECTIONS } from '@/lib/db/collections'

export async function GET() {
  try {
    const auditLogs = await getCollection(COLLECTIONS.AUDIT_LOGS)
    
    const logs = await auditLogs
      .find()
      .sort({ timestamp: -1 })
      .limit(100)
      .toArray()
    
    return NextResponse.json(logs)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
