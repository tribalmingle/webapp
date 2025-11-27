# Twilio Integration Guide

## Overview
Twilio provides SMS and voice communication capabilities for TribalMingle, enabling phone verification, SMS notifications, and voice call features.

## Setup

### 1. Create Twilio Account
1. Go to [https://www.twilio.com/console](https://www.twilio.com/console)
2. Create an account and verify your email
3. Get your Account SID and Auth Token from the dashboard

### 2. Purchase Phone Number
1. Navigate to Phone Numbers > Buy a Number
2. Select a number with SMS and Voice capabilities
3. Configure the number with webhook URLs

### 3. Set Up Verify Service (Optional)
1. Go to Verify > Services
2. Create a new Verify service
3. Note the Service SID

### 4. Environment Variables
Add these to your `.env.local`:

```env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890
TWILIO_VERIFY_SERVICE_SID=VAxxxxxxxxxxxxxxxxxxxxxxxxxxxxx (optional)
```

### 5. Configure Webhooks
Set up webhook URLs in Twilio console:

- **SMS Status Callback**: `https://yourdomain.com/api/webhooks/twilio`
- **Voice Status Callback**: `https://yourdomain.com/api/webhooks/twilio`

## Usage

### Send SMS
```typescript
import { sendSMS } from '@/lib/vendors/twilio-client'

const result = await sendSMS({
  to: '+1234567890',
  message: 'Your verification code is 123456',
  statusCallback: 'https://yourdomain.com/api/webhooks/twilio',
})

if (result.status === 'sent') {
  console.log('SMS sent:', result.sid)
}
```

### Initiate Voice Call
```typescript
import { initiateVoiceCall } from '@/lib/vendors/twilio-client'

const result = await initiateVoiceCall({
  to: '+1234567890',
  twimlUrl: 'https://yourdomain.com/api/twiml/verification',
})
```

### Validate Phone Number
```typescript
import { validatePhoneNumber } from '@/lib/vendors/twilio-client'

const result = await validatePhoneNumber('+1234567890')

if (result.valid) {
  console.log('Phone is valid:', result.formatted)
  console.log('Carrier:', result.carrier)
  console.log('Type:', result.type) // mobile, landline, voip
}
```

### Send Verification Code
```typescript
import { sendVerificationCode, verifyCode } from '@/lib/vendors/twilio-client'

// Send code
await sendVerificationCode({
  to: '+1234567890',
  channel: 'sms', // or 'call'
})

// Verify code
const result = await verifyCode({
  to: '+1234567890',
  code: '123456',
})

if (result.status === 'approved') {
  console.log('Code verified!')
}
```

## Webhook Handling

Twilio sends webhook events to `/api/webhooks/twilio` for:
- SMS delivery status (queued, sent, delivered, failed)
- Voice call status (initiated, ringing, answered, completed)
- Inbound SMS (if configured)

The webhook handler validates the signature and updates notification records accordingly.

## Rate Limits

- SMS: 1 message per second per phone number (default)
- Voice: 1 call per second per phone number (default)
- Verify: 5 attempts per 10 minutes per phone number

Contact Twilio support to increase limits for production.

## Cost Estimation

- **SMS (US)**: $0.0079 per message
- **Voice (US)**: $0.013 per minute
- **Phone Number**: $1.15 per month
- **Verify**: $0.05 per verification

For international pricing, see [Twilio Pricing](https://www.twilio.com/pricing).

## Testing

### Development Mode
For development, use the test credentials or a sandbox number:

```env
TWILIO_ACCOUNT_SID=ACtest...
TWILIO_AUTH_TOKEN=test_token
TWILIO_PHONE_NUMBER=+15005550006  # Twilio test number
```

### Test Phone Numbers
Twilio provides test numbers that always succeed or fail:
- `+15005550006` - Valid test number
- `+15005550001` - Invalid number
- `+15005550007` - Triggers exception

## Monitoring

Monitor Twilio usage in the console:
- **Message Logs**: View all SMS sent/received
- **Call Logs**: View all voice calls
- **Error Logs**: Debug failed messages/calls
- **Usage Triggers**: Set alerts for high usage

## Troubleshooting

### SMS Not Sending
1. Check Account SID and Auth Token are correct
2. Verify phone number has SMS capability
3. Check recipient number format (E.164: +country_code + number)
4. Check account balance (auto-recharge enabled?)
5. Review error logs in Twilio console

### Webhook Not Receiving Events
1. Verify webhook URL is publicly accessible (use ngrok for local dev)
2. Check webhook signature validation
3. Ensure webhook URL is configured in Twilio console
4. Check webhook logs in Twilio console

### Phone Validation Failing
1. Ensure Lookup API is enabled (separate Twilio product)
2. Check phone number format
3. Verify API credentials

## Security

- **Never commit credentials** - Use environment variables
- **Validate webhook signatures** - Prevents spoofing
- **Use HTTPS** - Required for production webhooks
- **Rotate auth tokens** - Periodically rotate for security
- **Monitor usage** - Set up alerts for unusual activity

## Support

- **Documentation**: [https://www.twilio.com/docs](https://www.twilio.com/docs)
- **Status Page**: [https://status.twilio.com](https://status.twilio.com)
- **Support**: [https://support.twilio.com](https://support.twilio.com)
