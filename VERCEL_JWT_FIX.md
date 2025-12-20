# Critical Environment Variables Missing from Vercel

## ⚠️ URGENT: JWT_SECRET Missing on Vercel

Your login is failing on the deployed server because **JWT_SECRET is not set in Vercel**.

## Quick Fix

### Add to Vercel Dashboard NOW:

1. Go to: https://vercel.com/tribalmingle/webapp/settings/environment-variables

2. Add this variable:
   ```
   Key: JWT_SECRET
   Value: sYlvbi6Ir7VIiORv96EaFv3jZdPlqGw7eDUhbUXS07g=
   Environment: Production, Preview, Development (all)
   ```

3. **Redeploy** after adding (Vercel auto-redeploys when you add env vars)

## Why This Happened

- `.env.production` is in `.gitignore` (correctly for security)
- Environment variables must be manually added to Vercel Dashboard
- Without JWT_SECRET, token creation fails → login fails

## Other Critical Variables to Verify

Make sure these are also set in Vercel:

### Required for Login/Auth:
- ✅ `MONGODB_URI` - Database connection
- ✅ `MONGODB_DB` - Database name
- ⚠️ `JWT_SECRET` - **MISSING** (causes login to fail)

### Required for SMS:
- ✅ `TERMII_API_KEY`
- ✅ `TERMII_SENDER_ID=tribemingle`

### Required for Media:
- ✅ `HOSTGATOR_API_KEY`
- ✅ `HOSTGATOR_BASE_URL=https://tm.d2d.ng`

## After Adding JWT_SECRET

1. Wait for Vercel to redeploy (usually 1-2 minutes)
2. Test login at your deployed site
3. Should work with:
   - Email: test@tribalmingle.com
   - Password: password123

## Security Note

The JWT_SECRET in .env.production should be rotated/changed for production. Generate a new secure one with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```
