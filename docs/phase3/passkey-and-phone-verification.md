# Passkey + Phone Verification Pipeline

## Overview
- `/api/onboarding/passkey/challenge` issues WebAuthn registration options via `startPasskeyRegistration` and stores the challenge inside the `tm_passkey_challenge` httpOnly cookie (5-minute TTL).
- `/api/onboarding/passkey/register` reads the challenge cookie, finalizes the attestation with `finishPasskeyRegistration`, persists the credential to `onboarding_applicants.passkey`, and clears the cookie.
- `/api/onboarding/verify-phone` handles both SMS delivery (`POST`) and confirmation (`PUT`) through `sendVerificationCode` and `confirmVerificationCode`. When Twilio credentials are absent the service falls back to deterministic mock SIDs.
- The new Step 5 "Secure your identity" panel inside `app/sign-up/page.tsx` forces prospects to complete both passkey enrollment (or explicitly skip when unsupported) and SMS verification before progressing to media capture.

## Passkey Enrollment
1. `POST /api/onboarding/passkey/challenge`
   ```json
   { "email": "prospect@example.com", "prospectId": "optional" }
   ```
   Response includes `{ options, prospectId }` where `options` is fed straight into `startRegistration`.
2. `POST /api/onboarding/passkey/register`
   ```json
   {
     "email": "prospect@example.com",
     "prospectId": "6564...",
     "attestation": { "id": "...", "rawId": "...", "response": { "clientDataJSON": "..." } }
   }
   ```
   Returns `{ "verified": true }` on success and updates the `onboarding_applicants` record with credential metadata plus `status: verified`.
3. Client UX: `startRegistration` is triggered from the new Step 5 button. Device support is auto-detected; if `PublicKeyCredential` is missing the UI flips into an approved bypass state (`passkeyBypass` flag stored in `sessionStorage`).

## Phone Verification
1. `POST /api/onboarding/verify-phone`
   ```json
   { "email": "prospect@example.com", "phone": "+15555555555", "prospectId": "optional" }
   ```
   Response returns `{ prospectId, sid }`. The UI stores the fresh `prospectId` (sessionStorage key `onboardingProspectId`).
2. `PUT /api/onboarding/verify-phone`
   ```json
   { "prospectId": "6564...", "phone": "+15555555555", "code": "123456" }
   ```
   Returns `{ "verified": true }` when Twilio approves (or always true under mock mode). `onboarding_applicants.phoneVerification` is stamped along with `status: verified`.
3. Client UX: Step 5 contains inputs for E.164 phone numbers, send/confirm controls, and gating logic (`phoneStatus === 'verified'`) so prospects cannot proceed without a confirmed SMS number.

## Environment Requirements
```
PASSKEY_RP_ID=
PASSKEY_RP_NAME=
PASSKEY_ORIGIN=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_VERIFY_SERVICE_SID=
```
- In non-production environments Twilio vars can remain empty; the onboarding service logs a warning and returns mock SIDs/approved responses for local development.
- Ensure `PASSKEY_ORIGIN` matches the exact scheme/host/port served to the browser to prevent WebAuthn origin mismatches.

## Next Up
- Media capture endpoints should consume `requestMediaUpload` / `finalizeMediaUpload` from `onboarding-profile-service.ts` so Step 6 liveness uploads hit S3 directly.
- Add analytics events (e.g., `onboarding.passkey.success`, `onboarding.phone.verified`) once the analytics SDK is wired into the member app shell.
