# Resend Email Setup

## Environment Variables

Add these to your Vercel project:

### Production & Preview
```
RESEND_API_KEY=re_FdBGJJNt_7pwbkVJthi461SW8HZGLXZdB
RESEND_FROM_EMAIL=Tribal Mingle <noreply@tribalmingle.com>
```

### Optional
```
NEXT_PUBLIC_APP_URL=https://tribalmingle.com
```

## How to Add to Vercel

1. Go to https://vercel.com/your-project/settings/environment-variables
2. Add `RESEND_API_KEY` with the value above
3. Add `RESEND_FROM_EMAIL` with the value above
4. Select both Production and Preview environments
5. Click Save

## Emails Being Sent

### 1. Welcome Email
- **When**: After successful signup
- **To**: New user's email
- **Content**: Welcome message with link to complete profile

### 2. Verification Code Email
- **When**: During phone verification
- **To**: User's email
- **Content**: 6-digit verification code (same code sent via SMS)

### 3. Password Reset Email
- **When**: User requests password reset
- **To**: User's email
- **Content**: Secure link to reset password (expires in 1 hour)

### 4. Registration Reminder Email
- **When**: 5 minutes after incomplete registration
- **To**: User's email (from Step 1)
- **Content**: Reminder to complete registration with benefits and continue link

## Resend Dashboard
https://resend.com/emails

## Testing Locally

Add to your `.env.local`:
```
RESEND_API_KEY=re_FdBGJJNt_7pwbkVJthi461SW8HZGLXZdB
RESEND_FROM_EMAIL=Tribal Mingle <noreply@tribalmingle.com>
```

## Important Notes

- Emails are sent asynchronously and won't block user signup/verification
- If Resend fails, users can still complete signup (SMS is primary verification)
- Check Resend dashboard for delivery status and logs
- Default sender: "Tribal Mingle <noreply@tribalmingle.com>"

## Verify Domain (Recommended)

To avoid emails going to spam:

1. Go to https://resend.com/domains
2. Add your domain: `tribalmingle.com`
3. Add DNS records (SPF, DKIM, DMARC)
4. Update `RESEND_FROM_EMAIL` to use your domain: `Tribal Mingle <hello@tribalmingle.com>`
