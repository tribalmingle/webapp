# Braze Integration Guide

## Overview
Braze is a customer engagement platform that powers TribalMingle's marketing automation, lifecycle campaigns, and personalized messaging.

## Setup

### 1. Create Braze Account
1. Go to [https://www.braze.com](https://www.braze.com)
2. Create an account and workspace
3. Select your data cluster (US-01, US-02, EU-01, etc.)

### 2. Get API Credentials
From Braze dashboard (Settings > API Keys):
- **REST API Key**: For server-side operations
- **REST Endpoint**: e.g., `https://rest.iad-01.braze.com`
- **App Group ID**: Your workspace identifier

### 3. Environment Variables
Add these to your `.env.local`:

```env
BRAZE_API_KEY=your_api_key
BRAZE_REST_ENDPOINT=https://rest.iad-01.braze.com
BRAZE_APP_GROUP_ID=your_app_group_id
```

### 4. Install SDK (Client-Side)
```bash
pnpm add @braze/web-sdk
```

## Usage

### Sync User to Braze
```typescript
import { syncUserToBraze } from '@/lib/vendors/braze-client'

await syncUserToBraze({
  externalId: 'user123',
  email: 'user@example.com',
  phone: '+1234567890',
  firstName: 'John',
  lastName: 'Doe',
  customAttributes: {
    tribe: 'Zulu',
    subscription_tier: 'premium',
    match_count: 15,
    last_active: new Date().toISOString(),
  },
})
```

### Batch User Sync
```typescript
import { syncUsersBatchToBraze } from '@/lib/vendors/braze-client'

const users = [
  {
    externalId: 'user123',
    email: 'user1@example.com',
    customAttributes: { tribe: 'Zulu' },
  },
  {
    externalId: 'user456',
    email: 'user2@example.com',
    customAttributes: { tribe: 'Yoruba' },
  },
]

await syncUsersBatchToBraze(users) // Max 75 users per batch
```

### Track Custom Event
```typescript
import { trackBrazeEvent } from '@/lib/vendors/braze-client'

await trackBrazeEvent({
  externalId: 'user123',
  eventName: 'match_made',
  properties: {
    matched_user_id: 'user456',
    compatibility_score: 85,
    tribe: 'Zulu',
  },
})
```

### Trigger Campaign
```typescript
import { triggerBrazeCampaign } from '@/lib/vendors/braze-client'

await triggerBrazeCampaign({
  campaignId: 'campaign_abc123',
  recipients: [
    {
      externalUserId: 'user123',
      triggerProperties: {
        match_name: 'Jane Doe',
        match_photo: 'https://...',
      },
    },
  ],
})
```

### Trigger Canvas Journey
```typescript
import { triggerBrazeCanvas } from '@/lib/vendors/braze-client'

await triggerBrazeCanvas({
  canvasId: 'canvas_xyz789',
  recipients: [
    {
      externalUserId: 'user123',
      canvasEntryProperties: {
        onboarding_step: 'profile_complete',
        tribe: 'Zulu',
      },
    },
  ],
})
```

### Update Subscription Group
```typescript
import { updateBrazeSubscriptionGroup } from '@/lib/vendors/braze-client'

await updateBrazeSubscriptionGroup({
  subscriptionGroupId: 'sub_group_123',
  subscriptionState: 'subscribed', // or 'unsubscribed'
  externalIds: ['user123', 'user456'],
})
```

### Delete User
```typescript
import { deleteUserFromBraze } from '@/lib/vendors/braze-client'

await deleteUserFromBraze('user123')
```

## Client-Side Integration

### Initialize Braze SDK
```typescript
import * as braze from '@braze/web-sdk'

braze.initialize(process.env.NEXT_PUBLIC_BRAZE_API_KEY!, {
  baseUrl: process.env.NEXT_PUBLIC_BRAZE_SDK_ENDPOINT!,
  enableLogging: process.env.NODE_ENV === 'development',
})

braze.openSession()
```

### Track Page View
```typescript
braze.logCustomEvent('page_view', {
  page: window.location.pathname,
})
```

### Request Push Permission
```typescript
braze.requestPushPermission()
```

## Campaign Types

### 1. Welcome Campaign
Triggered when user signs up:
- Entry: User profile created
- Journey: Onboarding emails, profile completion prompts
- Goal: 100% profile completion

### 2. Re-engagement Campaign
Triggered when user inactive:
- Entry: Last active > 7 days
- Journey: Reminder emails, new matches, special offers
- Goal: User returns to app

### 3. Match Notification Campaign
Triggered on new match:
- Entry: match_made event
- Journey: Immediate push + email notification
- Goal: User views match

### 4. Subscription Campaign
Triggered before trial expires:
- Entry: Trial expiry in 3 days
- Journey: Upgrade prompts, feature highlights
- Goal: User subscribes

## Segmentation

Create segments in Braze dashboard or via API:

### Active Premium Users
```
Subscription Tier = premium
AND Last Active < 7 days ago
```

### Specific Tribe
```
Tribe = Zulu
AND Email Opted In = true
```

### High Engagement Users
```
Match Count > 10
AND Messages Sent > 50
AND Last Active < 1 day ago
```

## Content Personalization

Use Liquid templating in Braze messages:

```liquid
Hi {{${first_name} | default: 'there'}},

You have {{custom_attribute.${match_count}}} new matches waiting!

{% if custom_attribute.${tribe} == 'Zulu' %}
Connect with fellow Zulu members today.
{% endif %}

Best,
The TribalMingle Team
```

## Webhooks

Braze can send webhooks for:
- Campaign sent/delivered/opened/clicked
- Canvas entered/completed
- Unsubscribe events

Configure in Braze dashboard under Developer Console > Webhooks.

## Testing

### Test Users
Create test users in Braze:
1. Go to Developer Console > Test Users
2. Add test user with your email
3. Trigger campaigns to test user

### Preview Campaigns
Use Braze's preview feature:
1. Select campaign/canvas
2. Click "Preview & Test"
3. Select test user
4. Review rendered content

## Monitoring

Monitor Braze performance:
- **Campaign Analytics**: Open rates, click rates, conversions
- **Canvas Analytics**: Step completion, drop-off rates
- **User Engagement**: DAU, MAU, retention cohorts
- **Revenue Tracking**: LTV, ARPU, subscription metrics

## Best Practices

### Frequency Capping
Prevent message fatigue:
- Max 2 marketing emails/week
- Max 1 push notification/day
- Allow users to set preferences

### Time-Based Delivery
Send at optimal times:
- Use Intelligent Timing (Braze ML)
- Respect user timezone
- Avoid late night/early morning

### A/B Testing
Test everything:
- Subject lines
- Message copy
- CTA buttons
- Send times
- Audience segments

### Compliance
Follow regulations:
- GDPR: Consent required for EU users
- CAN-SPAM: Unsubscribe link in emails
- TCPA: Consent for SMS (US)

## Cost Estimation

Braze pricing is based on MAU (Monthly Active Users):
- **Starter**: ~$1000/month (up to 50k MAU)
- **Growth**: Custom pricing (50k-500k MAU)
- **Enterprise**: Custom pricing (500k+ MAU)

Additional costs:
- **Email Sends**: Included up to certain limit
- **Push Notifications**: Included
- **SMS**: Pay-per-message via Twilio integration
- **WhatsApp**: Pay-per-conversation

## Troubleshooting

### User Not Syncing
1. Verify API key and endpoint are correct
2. Check external_id matches your system
3. Review API response for errors
4. Check Braze dashboard for user profile

### Campaign Not Sending
1. Verify campaign is active and scheduled
2. Check audience filter (are users matching?)
3. Review send time settings
4. Check message channel is enabled for users

### Events Not Tracking
1. Verify event name matches exactly (case-sensitive)
2. Check API response for errors
3. Review Event User Log in Braze dashboard
4. Ensure user exists in Braze before tracking event

## Security

- **API Key Rotation**: Rotate keys periodically
- **Endpoint Whitelisting**: Restrict API access by IP
- **User Data**: Only sync necessary PII
- **Consent Management**: Respect user preferences
- **Data Retention**: Configure per regulations

## Support

- **Documentation**: [https://www.braze.com/docs](https://www.braze.com/docs)
- **Community**: [https://community.braze.com](https://community.braze.com)
- **Support Portal**: Available for paid customers
- **Status Page**: [https://status.braze.com](https://status.braze.com)
