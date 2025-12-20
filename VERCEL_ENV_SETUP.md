# Vercel Environment Variables Setup Guide

## Quick Setup Instructions

You have two options to add environment variables to Vercel:

### Option 1: Manual Entry (Recommended for Security)
1. Go to: **Vercel Dashboard** → Your Project → **Settings** → **Environment Variables**
2. Click **Add New**
3. For each variable below, enter:
   - **Key**: The variable name (e.g., `MONGODB_URI`)
   - **Value**: The value from the `.env.production` file
   - **Environments**: Select `Production`, `Preview`, and `Development`
4. Click **Save**
5. Click **Redeploy** to apply changes

### Option 2: Use .env File (Faster)
1. Go to: **Vercel Dashboard** → Your Project → **Settings** → **Environment Variables**
2. Scroll to **Import .env file**
3. Upload the `.env.production` file
4. Verify all variables are imported
5. Click **Redeploy** to apply changes

## Environment Variables to Add

### Critical (Must Have):
```
MONGODB_URI=mongodb+srv://tribalmingle_db_user:HZHOdN3Q71W82gAi@tribalmingle.ndfbmbt.mongodb.net/
MONGODB_DB=tribalmingle
JWT_SECRET=your-super-secret-jwt-key-change-in-production-2024
TERMII_API_KEY=TLV90GetIWWqamdROrodTl3QUF6Crr6atRpxQ6S4f4Wilp61QWzxftmXSTNbNv
TERMII_SECRET_KEY=tsk_18zy65f076df5fee281752nahx
HOSTGATOR_API_KEY=6f273bc1-23b9-435c-b9ad-53c7ec2a1b19
```

### LaunchDarkly (Feature Flags):
```
LAUNCHDARKLY_SDK_KEY=sdk-4fc35730-f495-4cae-8e6c-7582aca0fab5
LAUNCHDARKLY_CLIENT_SIDE_ID=675b806fed1489094561e46a
NEXT_PUBLIC_LAUNCHDARKLY_CLIENT_SIDE_ID=675b806fed1489094561e46a
```

### Contentful (CMS):
```
CONTENTFUL_DELIVERY_TOKEN=<your_contentful_token>
CONTENTFUL_ENVIRONMENT=master
CONTENTFUL_LANDING_CONTENT_TYPE=landingPage
CONTENTFUL_TESTIMONIAL_CONTENT_TYPE=marketingTestimonial
```

### Public URLs:
```
NEXT_PUBLIC_APP_URL=https://tribalmingle.com
NEXT_PUBLIC_SOCKET_URL=https://tribalmingle.com
PASSKEY_RP_ID=tribalmingle.com
PASSKEY_RP_NAME=Tribal Mingle
PASSKEY_ORIGIN=https://tribalmingle.com
```

### Optional (Add if you have credentials):
```
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_VERIFY_SERVICE_SID=
TWILIO_PHONE_NUMBER=
REDIS_URL=
REDIS_PASSWORD=
LIVEKIT_URL=
LIVEKIT_API_KEY=
LIVEKIT_API_SECRET=
STRIPE_SECRET_KEY=
STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
ONESIGNAL_APP_ID=
ONESIGNAL_REST_API_KEY=
```

## After Adding Variables:

1. **Redeploy** your Vercel project:
   - Go to **Deployments**
   - Find your latest deployment
   - Click the three dots **...** → **Redeploy**

2. **Verify** the deployment:
   - Wait for the build to complete
   - Check the build logs for any errors
   - Test your application

## Troubleshooting

If deployment still fails:
1. Check the **Build & Logs** tab in Vercel for errors
2. Verify all required variables are set
3. Make sure variable names match exactly (case-sensitive)
4. Try a manual redeploy
5. Clear Vercel cache: **Settings** → **Git** → **Clear Cache** → **Redeploy**

## Security Notes

✅ **DO NOT commit** `.env.production` to GitHub
✅ **Store secrets** only in Vercel's encrypted environment variables
✅ **Never share** API keys or secret keys in chat/email
✅ **Rotate credentials** periodically in production
