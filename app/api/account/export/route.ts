/**
 * Account Data Export API
 * GDPR compliance - user data portability
 */

import { NextRequest, NextResponse } from 'next/server'
// Authentication will be handled by middleware or custom auth
// import { getServerSession } from 'next-auth'
// import { authOptions } from '@/lib/auth'
import { getMongoDb } from '@/lib/mongodb'
import { CollectionNames } from '@/lib/data/collection-names'
import { ObjectId } from 'mongodb'
import { queueDataExport } from '@/lib/jobs/data-export'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Request data export
 */
export async function POST(request: NextRequest) {
  try {
    // TODO: Implement proper authentication
    const userId = request.headers.get('x-user-id')
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const db = await getMongoDb()

    // Check if there's already a pending export
    const existingExport = await db
      .collection('data_exports')
      .findOne({
        user_id: new ObjectId(userId),
        status: { $in: ['pending', 'processing'] },
      })

    if (existingExport) {
      return NextResponse.json(
        {
          error: 'Export already in progress',
          exportId: existingExport._id.toString(),
          status: existingExport.status,
          requestedAt: existingExport.created_at,
        },
        { status: 409 }
      )
    }

    // Create export request record
    const exportRecord = {
      user_id: new ObjectId(userId),
      status: 'pending',
      requested_at: new Date(),
      created_at: new Date(),
      updated_at: new Date(),
    }

    const result = await db.collection('data_exports').insertOne(exportRecord)
    const exportId = result.insertedId.toString()

    // Queue the data export job
    await queueDataExport(userId)

    console.log('[account-export] Data export requested', {
      userId,
      exportId,
    })

    return NextResponse.json({
      exportId,
      status: 'pending',
      message: 'Your data export has been queued. You will receive an email when it is ready.',
    })
  } catch (error) {
    console.error('[account-export] Error requesting export', error)
    return NextResponse.json(
      { error: 'Failed to request data export' },
      { status: 500 }
    )
  }
}

/**
 * Get export status
 */
export async function GET(request: NextRequest) {
  try {
    // TODO: Implement proper authentication
    const userId = request.headers.get('x-user-id')
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const db = await getMongoDb()

    // Get most recent export request
    const exportRecord = await db
      .collection('data_exports')
      .findOne(
        { user_id: new ObjectId(userId) },
        { sort: { created_at: -1 } }
      )

    if (!exportRecord) {
      return NextResponse.json({
        hasExport: false,
        message: 'No export requested yet',
      })
    }

    const response: any = {
      hasExport: true,
      exportId: exportRecord._id.toString(),
      status: exportRecord.status,
      requestedAt: exportRecord.requested_at,
    }

    if (exportRecord.status === 'completed') {
      response.downloadUrl = exportRecord.download_url
      response.expiresAt = exportRecord.expires_at
      response.fileSize = exportRecord.file_size
    }

    if (exportRecord.status === 'failed') {
      response.error = exportRecord.error_message
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('[account-export] Error getting export status', error)
    return NextResponse.json(
      { error: 'Failed to get export status' },
      { status: 500 }
    )
  }
}
