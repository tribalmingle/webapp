# Background Jobs & Queue System

This document describes the background job processing system built with BullMQ and Redis.

## Architecture

The job system consists of:
- **Queue Setup** (`lib/jobs/queue-setup.ts`) - Redis connection, queue factory, health checks
- **Workers** (`lib/jobs/*.ts`) - Job processors for different job types
- **Admin Dashboard** (`app/admin/jobs/page.tsx`) - UI for monitoring and managing queues
- **API Routes** (`app/api/admin/jobs/*`) - Endpoints for queue management

## Job Types

### 1. Match Generation (`match-generation`)
- **Purpose**: Generate daily match recommendations for users
- **Schedule**: Daily at 3am (cron: `0 3 * * *`)
- **Concurrency**: 5 workers
- **Rate Limit**: 100 jobs/minute

**Jobs**:
- `generate` - Generate matches for a single user
- `batch` - Generate matches for all active users

**Usage**:
```typescript
import { queueMatchGeneration, queueBatchMatchGeneration } from '@/lib/jobs/match-generation'

// Queue for single user
await queueMatchGeneration(userId, 'high')

// Queue batch job
await queueBatchMatchGeneration({ limit: 1000 })
```

### 2. Notifications (`notifications`)
- **Purpose**: Send scheduled and batched notifications
- **Schedule**: 
  - Daily digests: 8am (cron: `0 8 * * *`)
  - Weekly digests: Monday 9am (cron: `0 9 * * 1`)
- **Concurrency**: 10 workers
- **Rate Limit**: 500 notifications/minute

**Jobs**:
- `scheduled` - Send a scheduled notification
- `batch` - Send notifications to multiple users
- `digest` - Send daily/weekly digest

**Usage**:
```typescript
import { queueScheduledNotification, queueBatchNotification } from '@/lib/jobs/notification-scheduler'

// Schedule notification
await queueScheduledNotification(notificationId, scheduledDate)

// Batch notification
await queueBatchNotification(userIds, notificationPayload)
```

### 3. Event Reminders (`event-reminders`)
- **Purpose**: Send automated event reminders
- **Schedule**:
  - 24h reminders: Every hour (cron: `0 * * * *`)
  - 1h reminders: Every 15 min (cron: `*/15 * * * *`)
  - Starting reminders: Every 5 min (cron: `*/5 * * * *`)
- **Concurrency**: 5 workers
- **Rate Limit**: 200 reminders/minute

**Jobs**:
- `reminder` - Send reminder for single event
- `batch` - Scan and queue reminders for all events in time window

**Usage**:
```typescript
import { queueEventReminder } from '@/lib/jobs/event-reminders'

await queueEventReminder(eventId, '24h')
```

### 4. Campaigns (`campaigns`)
- **Purpose**: Execute marketing campaigns
- **Schedule**: Every 6 hours (cron: `0 */6 * * *`)
- **Concurrency**: 2 workers
- **Rate Limit**: 50 jobs/minute

**Jobs**:
- `execute` - Execute a single campaign
- `process-active` - Process all active campaigns

**Usage**:
```typescript
import { queueCampaignExecution, scheduleCampaign } from '@/lib/jobs/campaign-executor'

// One-time execution
await queueCampaignExecution(campaignId)

// Recurring campaign
await scheduleCampaign(campaignId, '0 9 * * *')
```

### 5. Data Export (`data-export`)
- **Purpose**: GDPR compliance - export user data
- **Concurrency**: 2 workers
- **Rate Limit**: 20 exports/hour

**Jobs**:
- `export` - Export all data for a user

**Usage**:
```typescript
import { queueDataExport } from '@/lib/jobs/data-export'

await queueDataExport(userId, 'json')
```

### 6. Account Deletion (`account-deletion`)
- **Purpose**: GDPR compliance - right to be forgotten
- **Concurrency**: 1 worker (heavy operation)
- **Rate Limit**: 10 deletions/hour

**Jobs**:
- `delete` - Permanently delete user account and data

**Usage**:
```typescript
import { queueAccountDeletion, cancelAccountDeletion } from '@/lib/jobs/account-deletion'

// Schedule deletion (optional delay for grace period)
const scheduledFor = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
await queueAccountDeletion(userId, 'user_requested', scheduledFor)

// Cancel scheduled deletion
await cancelAccountDeletion(userId)
```

## Running Workers

### Development
```bash
pnpm tsx scripts/start-workers.ts
```

### Production
```bash
# Using PM2
pm2 start scripts/start-workers.ts --name workers

# Using Docker
docker-compose up -d workers
```

## Environment Variables

```env
# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# External Services
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=

LIVEKIT_API_KEY=
LIVEKIT_API_SECRET=
LIVEKIT_URL=

BRAZE_API_KEY=
BRAZE_REST_ENDPOINT=

GOOGLE_TRANSLATE_API_KEY=
DEEPL_API_KEY=
TRANSLATION_PROVIDER=google

AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=us-east-1
AWS_S3_BUCKET=
AWS_CLOUDFRONT_URL=
```

## Monitoring

### Admin Dashboard
Access the jobs dashboard at `/admin/jobs` to:
- View queue metrics (waiting, active, completed, failed, delayed)
- Inspect individual jobs
- Retry failed jobs
- Pause/resume queues
- Drain queues (remove waiting jobs)

### Health Check API
```bash
GET /api/admin/jobs/health
```

Returns Redis connection status and queue health.

### Queue Metrics API
```bash
GET /api/admin/jobs/metrics
```

Returns metrics for all queues.

## Job Configuration

### Retry Strategy
Default configuration (defined in `queue-setup.ts`):
- **Attempts**: 3
- **Backoff**: Exponential with 2s base delay
- **Retention**:
  - Completed: Keep last 100 jobs for 24 hours
  - Failed: Keep last 500 jobs indefinitely

### Custom Job Options
```typescript
await queue.add('job-name', data, {
  attempts: 5,
  backoff: {
    type: 'exponential',
    delay: 5000,
  },
  priority: 1, // Lower = higher priority
  delay: 60000, // Delay in ms
  removeOnComplete: true,
})
```

## Cron Jobs

Recurring jobs are set up automatically when workers start. To modify schedules:

1. Update the cron pattern in the respective job file
2. Restart workers

**Cron Pattern Format**: `* * * * *` (minute hour day month weekday)

Examples:
- `0 3 * * *` - Daily at 3am
- `*/15 * * * *` - Every 15 minutes
- `0 9 * * 1` - Monday at 9am

## Troubleshooting

### Workers Not Processing Jobs
1. Check Redis connection: `redis-cli ping`
2. Check worker logs for errors
3. Verify queue isn't paused in admin dashboard

### Jobs Failing
1. Check job details in admin dashboard
2. Review error messages and stack traces
3. Retry with modified data if needed

### Queue Backed Up
1. Increase worker concurrency
2. Add more worker instances
3. Optimize job processing logic

### High Memory Usage
1. Reduce `removeOnComplete.count` to keep fewer completed jobs
2. Regularly clean old jobs: `cleanQueue(queueName)`
3. Monitor Redis memory usage

## Best Practices

1. **Idempotency**: Make jobs idempotent (safe to retry)
2. **Small Payloads**: Keep job data small, store large data in DB
3. **Error Handling**: Always handle errors gracefully
4. **Monitoring**: Set up alerts for failed jobs
5. **Rate Limiting**: Use rate limiters to avoid overwhelming external APIs
6. **Testing**: Write tests for job processors
7. **Cleanup**: Regularly clean old completed/failed jobs
