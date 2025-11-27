# AWS S3 Integration Guide

## Overview
AWS S3 provides scalable, secure object storage for TribalMingle's media files (photos, videos, voice notes, data exports).

## Setup

### 1. Create AWS Account
1. Go to [https://aws.amazon.com](https://aws.amazon.com)
2. Create an account and set up billing
3. Access AWS Console

### 2. Create S3 Bucket
```bash
aws s3 mb s3://tribalmingle-media --region us-east-1
```

Or via console:
1. Navigate to S3
2. Click "Create bucket"
3. Name: `tribalmingle-media`
4. Region: `us-east-1`
5. Block public access: ON (use signed URLs instead)
6. Versioning: Optional
7. Encryption: Enable (AES-256)

### 3. Create IAM User
Create programmatic access user:
```bash
aws iam create-user --user-name tribalmingle-s3-user
aws iam attach-user-policy --user-name tribalmingle-s3-user \
  --policy-arn arn:aws:iam::aws:policy/AmazonS3FullAccess
aws iam create-access-key --user-name tribalmingle-s3-user
```

Save the Access Key ID and Secret Access Key.

### 4. Configure CORS
Enable CORS for client uploads:
```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedOrigins": [
      "https://tribalmingle.com",
      "https://*.tribalmingle.com",
      "http://localhost:3000"
    ],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
```

Apply via AWS CLI:
```bash
aws s3api put-bucket-cors --bucket tribalmingle-media \
  --cors-configuration file://cors.json
```

### 5. Environment Variables
Add these to your `.env.local`:

```env
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
AWS_REGION=us-east-1
AWS_S3_BUCKET=tribalmingle-media
```

### 6. Set Up CloudFront (Optional but Recommended)
Create CloudFront distribution for faster delivery:
1. Navigate to CloudFront
2. Create distribution
3. Origin: tribalmingle-media.s3.amazonaws.com
4. Viewer Protocol Policy: Redirect HTTP to HTTPS
5. Cache Policy: CachingOptimized
6. Note the CloudFront domain (e.g., d123456.cloudfront.net)

Add to `.env.local`:
```env
AWS_CLOUDFRONT_DOMAIN=d123456.cloudfront.net
```

## Usage

### Upload File
```typescript
import { uploadToS3 } from '@/lib/vendors/s3-client'

const file = await fetch('image.jpg').then(r => r.blob())

const result = await uploadToS3({
  key: `photos/${userId}/${photoId}.jpg`,
  body: file,
  contentType: 'image/jpeg',
  metadata: {
    userId,
    uploadedAt: new Date().toISOString(),
  },
})

if (result.success) {
  console.log('File uploaded:', result.key)
  console.log('URL:', result.url)
}
```

### Upload with Progress
```typescript
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { Upload } from '@aws-sdk/lib-storage'

const upload = new Upload({
  client: new S3Client({ region: 'us-east-1' }),
  params: {
    Bucket: 'tribalmingle-media',
    Key: `videos/${userId}/${videoId}.mp4`,
    Body: file,
    ContentType: 'video/mp4',
  },
})

upload.on('httpUploadProgress', (progress) => {
  console.log(`Uploaded ${progress.loaded}/${progress.total}`)
})

await upload.done()
```

### Generate Signed URL (Download)
```typescript
import { getSignedDownloadUrl } from '@/lib/vendors/s3-client'

const result = await getSignedDownloadUrl({
  key: `photos/${userId}/${photoId}.jpg`,
  expiresIn: 3600, // 1 hour
})

if (result.success) {
  // User can download from this URL for 1 hour
  return result.url
}
```

### Generate Signed URL (Upload)
```typescript
import { getSignedUploadUrl } from '@/lib/vendors/s3-client'

const result = await getSignedUploadUrl({
  key: `photos/${userId}/${photoId}.jpg`,
  contentType: 'image/jpeg',
  expiresIn: 900, // 15 minutes
})

if (result.success) {
  // Client can upload directly to this URL
  return result.url
}
```

### Delete File
```typescript
import { deleteFromS3 } from '@/lib/vendors/s3-client'

const result = await deleteFromS3({
  key: `photos/${userId}/${photoId}.jpg`,
})

if (result.success) {
  console.log('File deleted')
}
```

### Copy File
```typescript
import { copyFile } from '@/lib/vendors/s3-client'

const result = await copyFile({
  sourceKey: `photos/${userId}/original.jpg`,
  destinationKey: `photos/${userId}/thumbnail.jpg`,
})
```

### List Files
```typescript
import { listFiles } from '@/lib/vendors/s3-client'

const result = await listFiles({
  prefix: `photos/${userId}/`,
  maxKeys: 100,
})

if (result.success) {
  result.files.forEach(file => {
    console.log(file.key, file.size, file.lastModified)
  })
}
```

### Check File Exists
```typescript
import { fileExists } from '@/lib/vendors/s3-client'

const exists = await fileExists(`photos/${userId}/${photoId}.jpg`)
```

## Folder Structure

Organize files by type:
```
tribalmingle-media/
├── photos/
│   ├── {userId}/
│   │   ├── {photoId}.jpg
│   │   ├── {photoId}_thumbnail.jpg
│   │   └── {photoId}_large.jpg
├── videos/
│   └── {userId}/
│       ├── {videoId}.mp4
│       └── {videoId}_transcoded.mp4
├── voice-notes/
│   └── {userId}/
│       └── {noteId}.m4a
├── exports/
│   └── {userId}/
│       └── data-{timestamp}.zip
└── temp/
    └── {uploadId}/
        └── {filename}
```

## Lifecycle Policies

Auto-delete old files to save costs:

```json
{
  "Rules": [
    {
      "Id": "DeleteTempAfter1Day",
      "Prefix": "temp/",
      "Status": "Enabled",
      "Expiration": {
        "Days": 1
      }
    },
    {
      "Id": "DeleteExportsAfter7Days",
      "Prefix": "exports/",
      "Status": "Enabled",
      "Expiration": {
        "Days": 7
      }
    },
    {
      "Id": "TransitionOldPhotosToIA",
      "Prefix": "photos/",
      "Status": "Enabled",
      "Transitions": [
        {
          "Days": 90,
          "StorageClass": "STANDARD_IA"
        },
        {
          "Days": 180,
          "StorageClass": "GLACIER"
        }
      ]
    }
  ]
}
```

Apply via AWS CLI:
```bash
aws s3api put-bucket-lifecycle-configuration \
  --bucket tribalmingle-media \
  --lifecycle-configuration file://lifecycle.json
```

## S3 Events

Configure S3 to send events to webhook:

1. Create SNS topic:
```bash
aws sns create-topic --name tribalmingle-s3-events
```

2. Subscribe webhook to topic:
```bash
aws sns subscribe \
  --topic-arn arn:aws:sns:us-east-1:123456789:tribalmingle-s3-events \
  --protocol https \
  --notification-endpoint https://tribalmingle.com/api/webhooks/s3
```

3. Configure bucket notifications:
```json
{
  "TopicConfigurations": [
    {
      "TopicArn": "arn:aws:sns:us-east-1:123456789:tribalmingle-s3-events",
      "Events": ["s3:ObjectCreated:*", "s3:ObjectRemoved:*"]
    }
  ]
}
```

## Image Processing

### Lambda Function for Auto-Resize
Create Lambda function triggered by S3 uploads:

```javascript
const sharp = require('sharp')
const AWS = require('aws-sdk')
const s3 = new AWS.S3()

exports.handler = async (event) => {
  const bucket = event.Records[0].s3.bucket.name
  const key = event.Records[0].s3.object.key
  
  // Download original
  const original = await s3.getObject({ Bucket: bucket, Key: key }).promise()
  
  // Create thumbnail
  const thumbnail = await sharp(original.Body)
    .resize(200, 200, { fit: 'cover' })
    .jpeg({ quality: 80 })
    .toBuffer()
  
  // Upload thumbnail
  await s3.putObject({
    Bucket: bucket,
    Key: key.replace('.jpg', '_thumbnail.jpg'),
    Body: thumbnail,
    ContentType: 'image/jpeg',
  }).promise()
}
```

## Video Transcoding

Use AWS MediaConvert for video processing:

```typescript
import { MediaConvert } from '@aws-sdk/client-mediaconvert'

const mediaConvert = new MediaConvert({ region: 'us-east-1' })

await mediaConvert.createJob({
  Role: 'arn:aws:iam::123456789:role/MediaConvertRole',
  Settings: {
    Inputs: [{
      FileInput: `s3://tribalmingle-media/videos/${userId}/${videoId}.mp4`,
    }],
    OutputGroups: [{
      Name: 'File Group',
      Outputs: [{
        ContainerSettings: { Container: 'MP4' },
        VideoDescription: {
          Width: 1280,
          Height: 720,
          CodecSettings: {
            Codec: 'H_264',
            H264Settings: { Bitrate: 2000000 },
          },
        },
      }],
      OutputGroupSettings: {
        Type: 'FILE_GROUP_SETTINGS',
        FileGroupSettings: {
          Destination: `s3://tribalmingle-media/transcoded/${userId}/`,
        },
      },
    }],
  },
})
```

## Cost Optimization

### Storage Costs
- **Standard**: $0.023 per GB/month
- **Intelligent-Tiering**: $0.023 (frequent) → $0.0125 (infrequent)
- **Glacier**: $0.004 per GB/month

### Request Costs
- **PUT/POST**: $0.005 per 1000 requests
- **GET**: $0.0004 per 1000 requests

### Data Transfer
- **Upload**: FREE
- **Download**: $0.09 per GB (first 10 TB)
- **CloudFront**: $0.085 per GB (cheaper than direct S3)

### Tips
1. Use lifecycle policies to move old files to cheaper storage
2. Use CloudFront to reduce direct S3 requests
3. Enable S3 Transfer Acceleration for faster uploads ($0.04/GB extra)
4. Compress files before upload
5. Delete unused files regularly

## Security

### Bucket Policies
Restrict access:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "DenyInsecureTransport",
      "Effect": "Deny",
      "Principal": "*",
      "Action": "s3:*",
      "Resource": [
        "arn:aws:s3:::tribalmingle-media",
        "arn:aws:s3:::tribalmingle-media/*"
      ],
      "Condition": {
        "Bool": {
          "aws:SecureTransport": "false"
        }
      }
    }
  ]
}
```

### Encryption
- **At Rest**: Enable default encryption (AES-256 or KMS)
- **In Transit**: Always use HTTPS
- **Client-Side**: Encrypt sensitive files before upload

### Access Control
- Use IAM roles for EC2/Lambda (not access keys)
- Use signed URLs for temporary access
- Enable MFA delete for production buckets
- Audit access with CloudTrail

## Monitoring

Enable S3 metrics and logging:

```bash
# Enable access logging
aws s3api put-bucket-logging --bucket tribalmingle-media \
  --bucket-logging-status file://logging.json

# Enable CloudWatch metrics
aws s3api put-bucket-metrics-configuration \
  --bucket tribalmingle-media \
  --id EntireBucket \
  --metrics-configuration file://metrics.json
```

Monitor:
- **Storage**: Total size, object count
- **Requests**: GET/PUT rates, errors
- **Data Transfer**: Bytes uploaded/downloaded
- **Costs**: Daily spending trends

## Support

- **Documentation**: [https://docs.aws.amazon.com/s3/](https://docs.aws.amazon.com/s3/)
- **Forums**: [https://forums.aws.amazon.com](https://forums.aws.amazon.com)
- **Support Plans**: Developer ($29/mo), Business ($100/mo), Enterprise ($15k/mo)
- **Status**: [https://status.aws.amazon.com](https://status.aws.amazon.com)
