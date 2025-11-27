/**
 * AWS S3 Webhook Handler
 * Processes S3 events for media upload completion and processing
 */

import { NextRequest, NextResponse } from 'next/server'
import { getMongoDb } from '@/lib/mongodb'
import { CollectionNames } from '@/lib/data/collection-names'
import { AnalyticsService } from '@/lib/services/analytics-service'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface S3Event {
  eventVersion: string
  eventSource: string
  awsRegion: string
  eventTime: string
  eventName: string
  s3: {
    s3SchemaVersion: string
    configurationId: string
    bucket: {
      name: string
      arn: string
    }
    object: {
      key: string
      size: number
      eTag: string
      versionId?: string
    }
  }
}

interface SNSMessage {
  Type: string
  MessageId: string
  TopicArn: string
  Subject?: string
  Message: string
  Timestamp: string
  SignatureVersion: string
  Signature: string
  SigningCertURL: string
  UnsubscribeURL: string
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // S3 events come wrapped in SNS messages
    if (body.Type === 'SubscriptionConfirmation') {
      // Auto-confirm SNS subscription
      console.log('[s3-webhook] SNS subscription confirmation', {
        topicArn: body.TopicArn,
        subscribeURL: body.SubscribeURL,
      })

      // In production, you'd fetch the SubscribeURL to confirm
      // For now, just log it
      return NextResponse.json({ message: 'Subscription noted' })
    }

    if (body.Type === 'Notification') {
      const message: SNSMessage = body
      const s3Events: { Records: S3Event[] } = JSON.parse(message.Message)

      console.log('[s3-webhook] Received S3 events', {
        count: s3Events.Records?.length,
      })

      const db = await getMongoDb()

      // Process each S3 event
      for (const event of s3Events.Records || []) {
        await processS3Event(db, event)
      }

      return NextResponse.json({ processed: s3Events.Records?.length || 0 })
    }

    console.warn('[s3-webhook] Unknown message type', { type: body.Type })
    return NextResponse.json({ error: 'Unknown message type' }, { status: 400 })
  } catch (error) {
    console.error('[s3-webhook] Error processing webhook', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function processS3Event(db: any, event: S3Event) {
  const eventName = event.eventName
  const objectKey = event.s3.object.key
  const bucketName = event.s3.bucket.name
  const objectSize = event.s3.object.size

  console.log('[s3-webhook] Processing S3 event', {
    eventName,
    objectKey,
    bucketName,
    objectSize,
  })

  // Track analytics
  await AnalyticsService.track({
    eventType: 's3.object.event',
    properties: {
      eventName,
      objectKey,
      bucketName,
      objectSize,
      timestamp: event.eventTime,
    },
  })

  // Handle different S3 event types
  if (eventName.startsWith('ObjectCreated:')) {
    await handleObjectCreated(db, event)
  } else if (eventName.startsWith('ObjectRemoved:')) {
    await handleObjectRemoved(db, event)
  }
}

async function handleObjectCreated(db: any, event: S3Event) {
  const objectKey = event.s3.object.key
  const objectSize = event.s3.object.size

  // Extract user ID and file type from object key
  // Expected format: photos/{userId}/{photoId}.jpg or exports/{userId}/data.zip
  const keyParts = objectKey.split('/')
  
  if (keyParts[0] === 'photos' && keyParts.length >= 3) {
    // Photo upload completed
    const userId = keyParts[1]
    const photoId = keyParts[2].split('.')[0]

    console.log('[s3-webhook] Photo uploaded', {
      userId,
      photoId,
      size: objectSize,
    })

    // Update photo record with S3 metadata
    await db.collection(CollectionNames.USER_PHOTOS).updateOne(
      { photo_id: photoId },
      {
        $set: {
          s3_key: objectKey,
          file_size: objectSize,
          upload_completed_at: new Date(),
          status: 'processing', // Ready for moderation/optimization
        },
      }
    )

    // Track photo upload
    await AnalyticsService.track({
      eventType: 'photo.uploaded',
      userId,
      properties: {
        photoId,
        fileSize: objectSize,
      },
    })
  } else if (keyParts[0] === 'exports' && keyParts.length >= 2) {
    // Data export completed
    const userId = keyParts[1]

    console.log('[s3-webhook] Data export uploaded', {
      userId,
      size: objectSize,
    })

    // Update export record
    await db.collection(CollectionNames.ACCOUNT_DELETIONS).updateOne(
      { user_id: userId, type: 'export' },
      {
        $set: {
          s3_key: objectKey,
          file_size: objectSize,
          export_completed_at: new Date(),
          status: 'completed',
        },
      }
    )

    // Track export completion
    await AnalyticsService.track({
      eventType: 'data_export.completed',
      userId,
      properties: {
        fileSize: objectSize,
      },
    })
  } else if (keyParts[0] === 'transcoded' && keyParts.length >= 3) {
    // Video transcoding completed (from MediaConvert)
    const userId = keyParts[1]
    const videoId = keyParts[2].split('.')[0]

    console.log('[s3-webhook] Video transcoded', {
      userId,
      videoId,
      size: objectSize,
    })

    // Update photo/media record with transcoded version
    await db.collection(CollectionNames.USER_PHOTOS).updateOne(
      { photo_id: videoId },
      {
        $set: {
          transcoded_s3_key: objectKey,
          transcoded_file_size: objectSize,
          transcoding_completed_at: new Date(),
          status: 'ready',
        },
      }
    )

    // Track transcoding completion
    await AnalyticsService.track({
      eventType: 'video.transcoded',
      userId,
      properties: {
        videoId,
        fileSize: objectSize,
      },
    })
  }
}

async function handleObjectRemoved(db: any, event: S3Event) {
  const objectKey = event.s3.object.key

  console.log('[s3-webhook] Object removed', { objectKey })

  // Extract user ID from object key
  const keyParts = objectKey.split('/')

  if (keyParts[0] === 'photos' && keyParts.length >= 3) {
    // Photo deleted
    const photoId = keyParts[2].split('.')[0]

    await db.collection(CollectionNames.USER_PHOTOS).updateOne(
      { photo_id: photoId },
      {
        $set: {
          s3_deleted_at: new Date(),
          status: 'deleted',
        },
      }
    )

    console.log('[s3-webhook] Photo marked as deleted', { photoId })
  }
}
