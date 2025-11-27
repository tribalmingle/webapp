/**
 * AWS S3 Client
 * Enhanced file storage operations
 */

import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  CopyObjectCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
})

const BUCKET_NAME = process.env.AWS_S3_BUCKET || 'tribalmingle-uploads'
const CDN_URL = process.env.AWS_CLOUDFRONT_URL

export interface UploadOptions {
  contentType?: string
  metadata?: Record<string, string>
  cacheControl?: string
  acl?: 'private' | 'public-read'
}

/**
 * Upload a file to S3
 */
export async function uploadToS3(
  buffer: Buffer,
  key: string,
  options: UploadOptions = {}
) {
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: buffer,
    ContentType: options.contentType || 'application/octet-stream',
    Metadata: options.metadata,
    CacheControl: options.cacheControl || 'max-age=31536000', // 1 year
    ACL: options.acl || 'public-read',
  })

  await s3Client.send(command)

  const url = CDN_URL
    ? `${CDN_URL}/${key}`
    : `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${key}`

  console.log('[s3] File uploaded', { key, url })

  return { key, url }
}

/**
 * Delete a file from S3
 */
export async function deleteFromS3(key: string) {
  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  })

  await s3Client.send(command)

  console.log('[s3] File deleted', { key })

  return { deleted: true, key }
}

/**
 * Get a signed URL for private files
 */
export async function getSignedDownloadUrl(key: string, expiresIn = 3600) {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  })

  const url = await getSignedUrl(s3Client, command, { expiresIn })

  return url
}

/**
 * Check if a file exists
 */
export async function fileExists(key: string): Promise<boolean> {
  try {
    const command = new HeadObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    })

    await s3Client.send(command)
    return true
  } catch (error: any) {
    if (error.name === 'NotFound') {
      return false
    }
    throw error
  }
}

/**
 * Copy a file within S3
 */
export async function copyFile(sourceKey: string, destinationKey: string) {
  const command = new CopyObjectCommand({
    Bucket: BUCKET_NAME,
    CopySource: `${BUCKET_NAME}/${sourceKey}`,
    Key: destinationKey,
  })

  await s3Client.send(command)

  console.log('[s3] File copied', { sourceKey, destinationKey })

  return { key: destinationKey }
}

/**
 * List files in a folder
 */
export async function listFiles(prefix: string, maxKeys = 1000) {
  const command = new ListObjectsV2Command({
    Bucket: BUCKET_NAME,
    Prefix: prefix,
    MaxKeys: maxKeys,
  })

  const response = await s3Client.send(command)

  return {
    files: response.Contents?.map((obj) => ({
      key: obj.Key,
      size: obj.Size,
      lastModified: obj.LastModified,
    })) || [],
    count: response.KeyCount || 0,
    isTruncated: response.IsTruncated || false,
  }
}

/**
 * Get file metadata
 */
export async function getFileMetadata(key: string) {
  const command = new HeadObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  })

  const response = await s3Client.send(command)

  return {
    contentType: response.ContentType,
    contentLength: response.ContentLength,
    lastModified: response.LastModified,
    metadata: response.Metadata,
    etag: response.ETag,
  }
}
