# Registration Reminder System

## Overview
Users who start registration but don't complete it within 5 minutes receive an automated reminder email.

## How It Works

### 1. Data Submission Point
**User data is saved to database immediately after Step 1** (name, email, password, DOB):
- API: `/api/auth/early-register`
- Happens asynchronously (doesn't block UI)
- Creates user record with:
  - `registrationComplete: false`
  - `registrationStep: 1`
  - `registrationReminderSent: false`
- Email and password now locked (cannot reuse)

### 2. Registration Steps
```
Step 1: Basic Info (name, email, password, DOB) → ✅ SAVED TO DATABASE
Step 2: Details (gender, marital status, height, education, etc.)
Step 3: Location & Tribe
Step 4: Compatibility Quiz
Step 5: Secure Account (passkey + phone verification)
Step 6: Identity Media Uploads
Step 7: Subscription Plan → ✅ REGISTRATION COMPLETE
```

### 3. Background Job
A cron job runs every 5 minutes checking for:
- Users with `registrationComplete: false`
- Created more than 5 minutes ago
- Updated less than 15 minutes ago (not actively registering)
- Haven't received reminder (`registrationReminderSent: false`)

**API Endpoint:** `/api/cron/send-registration-reminders`

### 4. Reminder Email
Sent via Resend with:
- Personalized greeting with user's name
- Benefits of completing registration
- Call-to-action button linking to login page
- User logs in → redirected to continue registration

### 5. User Returns
When user logs back in:
- System checks `registrationComplete` status
- If `false`, redirects to `/sign-up?step=continue`
- User picks up where they left off
- All previous data preserved

## API Endpoints

### POST /api/auth/early-register
**Called after Step 1** - Creates minimal user record

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe",
  "dateOfBirth": "1990-01-01"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Account created - continue registration",
  "token": "jwt-token",
  "user": {
    "_id": "...",
    "email": "user@example.com",
    "name": "John Doe",
    "registrationComplete": false,
    "registrationStep": 1
  }
}
```

### POST /api/cron/send-registration-reminders
**Background job** - Sends reminder emails

**Headers:**
```
Authorization: Bearer YOUR_CRON_SECRET
```

**Response:**
```json
{
  "success": true,
  "message": "Processed 15 incomplete registrations",
  "results": {
    "total": 15,
    "sent": 14,
    "failed": 1,
    "errors": ["user@example.com: SMTP error"]
  }
}
```

### GET /api/cron/send-registration-reminders
**Monitoring** - Check how many users need reminders

**Response:**
```json
{
  "success": true,
  "stats": {
    "needingReminder": 23,
    "totalIncomplete": 145,
    "remindersSent": 89
  }
}
```

## Database Schema

### User Fields
```typescript
{
  registrationComplete: boolean        // false until Step 7 complete
  registrationStep?: number            // 1-7, tracks progress
  registrationReminderSent?: boolean   // true after reminder sent
  reminderSentAt?: Date                // timestamp of reminder
  createdAt: Date                      // when Step 1 completed
  updatedAt: Date                      // last activity
}
```

## Setting Up Cron Job

### Option 1: Vercel Cron (Recommended for Vercel deployments)

Create `vercel.json` in project root:
```json
{
  "crons": [
    {
      "path": "/api/cron/send-registration-reminders",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

This runs every 5 minutes automatically.

### Option 2: External Cron Service

Use services like:
- cron-job.org
- EasyCron
- Render Cron Jobs
- Railway Cron Jobs

**Setup:**
1. Create account on cron service
2. Add job with URL: `https://tribalmingle.com/api/cron/send-registration-reminders`
3. Method: POST
4. Headers: `Authorization: Bearer YOUR_CRON_SECRET`
5. Schedule: Every 5 minutes (`*/5 * * * *`)

### Option 3: GitHub Actions (Free)

Create `.github/workflows/send-reminders.yml`:
```yaml
name: Send Registration Reminders

on:
  schedule:
    - cron: '*/5 * * * *'  # Every 5 minutes
  workflow_dispatch:  # Allow manual trigger

jobs:
  send-reminders:
    runs-on: ubuntu-latest
    steps:
      - name: Send reminders
        run: |
          curl -X POST \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}" \
            https://tribalmingle.com/api/cron/send-registration-reminders
```

## Environment Variables

Add to Vercel/production:

```bash
CRON_SECRET=your-secure-random-string-here
RESEND_API_KEY=re_FdBGJJNt_7pwbkVJthi461SW8HZGLXZdB
RESEND_FROM_EMAIL=Tribal Mingle <noreply@tribalmingle.com>
```

Generate secure CRON_SECRET:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Email Template

The reminder email includes:
- Personalized greeting
- Progress reminder ("You're almost there!")
- Benefits of completing registration
- Call-to-action button
- One-time notice (won't spam)

**Subject:** ⏰ Complete Your Tribal Mingle Registration

## Testing

### Test Early Registration
```bash
curl -X POST http://localhost:3000/api/auth/early-register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test123",
    "name": "Test User",
    "dateOfBirth": "1990-01-01"
  }'
```

### Test Reminder Job
```bash
# Check stats
curl http://localhost:3000/api/cron/send-registration-reminders

# Send reminders
curl -X POST http://localhost:3000/api/cron/send-registration-reminders \
  -H "Authorization: Bearer your-cron-secret"
```

### Manually Trigger Reminder for Testing
```javascript
// In MongoDB, set user's createdAt to 6 minutes ago
db.users.updateOne(
  { email: "test@example.com" },
  {
    $set: {
      createdAt: new Date(Date.now() - 6 * 60 * 1000),
      updatedAt: new Date(Date.now() - 16 * 60 * 1000)
    }
  }
)
```

## Monitoring

### Check Dashboard
View incomplete registrations in admin:
- URL: `/api/admin/incomplete-registrations`
- Shows all users with `registrationComplete: false`
- Includes registration step and timestamp

### Logs
The cron job logs:
```
[reminder-job] Found 15 users to remind
[reminder-job] Sent reminder to user1@example.com
[reminder-job] Sent reminder to user2@example.com
[reminder-job] Failed to send to user3@example.com: SMTP timeout
```

## User Flow Examples

### Success Case
1. **Step 1** (11:00 AM): User enters name, email, password
   - → Data saved to database asynchronously
2. **Step 2-7** (11:02 AM): User completes all steps
   - → `registrationComplete: true`
   - → Never receives reminder

### Incomplete Case
1. **Step 1** (11:00 AM): User enters name, email, password
   - → Data saved to database
2. **User Leaves** (11:01 AM): Closes browser
3. **Cron Job** (11:05 AM): Detects incomplete registration
   - → Sends reminder email
   - → Sets `registrationReminderSent: true`
4. **User Returns** (11:15 AM): Opens email, clicks link
   - → Logs in with email/password
   - → Redirected to continue registration
   - → Completes Steps 2-7

### Password Reset Case
1. User started registration at Step 1
2. User forgets password before completing
3. User requests password reset
4. User resets password → redirects to continue registration
5. User completes remaining steps

## Security

- Cron endpoint protected with `CRON_SECRET`
- Reminders only sent once per user
- No sensitive data in emails
- Login required to continue registration
- Email/phone locked after initial use

## Performance

- Processes 50 users per job run
- Runs every 5 minutes
- Average: 3 users per run (varies)
- Email send: ~500ms per email
- Total job time: <30 seconds

## Future Enhancements

1. **Multiple Reminders**: Send second reminder after 24 hours
2. **Step-Specific Messages**: Different email based on which step abandoned
3. **Push Notifications**: Browser push for active sessions
4. **Analytics Dashboard**: Track abandonment by step
5. **A/B Testing**: Test different reminder timing/messaging
6. **Cleanup Job**: Delete accounts abandoned >30 days

## Troubleshooting

**Reminders not sending?**
- Check CRON_SECRET is set in environment
- Verify Resend API key is valid
- Check cron job is running (logs)
- Confirm users match criteria (5+ min old, not updated recently)

**Too many reminders?**
- Increase time threshold (e.g., 10 minutes instead of 5)
- Reduce cron frequency (e.g., every 10 minutes)
- Add cooldown period after reminder sent

**Users not completing after reminder?**
- A/B test email messaging
- Check continue URL is correct
- Verify login flow redirects properly
- Add chat support link in email
