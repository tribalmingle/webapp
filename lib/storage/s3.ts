import { randomUUID } from 'node:crypto'

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const bucket = process.env.S3_MEDIA_BUCKET
const region = process.env.AWS_REGION ?? 'us-east-1'

let client: S3Client | null = null

function getClient() {
  if (!bucket) {
    return null
  }

  if (!client) {
    client = new S3Client({ region })
  }

  return client
}

export interface SignedUploadResponse {
  uploadUrl: string
  fileUrl: string
  key: string
  expiresIn: number
}

export async function createSignedUpload(contentType: string, prefix = 'onboarding'): Promise<SignedUploadResponse> {
  const key = `${prefix}/${randomUUID()}`
  const s3 = getClient()

  if (!bucket || !s3) {
    const mockUrl = `https://example.com/${key}`
    return {
      uploadUrl: mockUrl,
      fileUrl: mockUrl,
      key,
      expiresIn: 0,
    }
  }

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
    ACL: 'private',
  })

  const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 900 })

  return {
    uploadUrl,
    fileUrl: `https://${bucket}.s3.${region}.amazonaws.com/${key}`,
    key,
    expiresIn: 900,
  }
}
