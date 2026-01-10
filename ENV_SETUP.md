# TribalMingle Env Setup

Use this as a checklist, then delete when done.

## Expo (tmapp)
- EXPO_PUBLIC_API_BASE_URL=https://tribalmingle.com/api
- EXPO_PUBLIC_APP_ENV=production

## Vercel (tribalmingle Next.js API)
- MONGODB_URI=<your Mongo connection string>
- MONGODB_DB=tribalmingle
- JWT_SECRET=<random strong secret>
- RESEND_API_KEY=<your Resend key>
- NEXT_PUBLIC_APP_URL=https://tribalmingle.com

## Notes
- The Expo build and local dev will default to the production API if the env var is missing, but set it explicitly to avoid mistakes.
- After setting Vercel vars, redeploy the site so middleware and API pick them up.
- Once applied, feel free to delete this file.
