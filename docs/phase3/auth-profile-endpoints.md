# Auth & Profile Endpoint Contracts

_Updated: 2025-11-22_

## Purpose
Phase 3 Step 8 calls for mobile-ready contracts that wrap the new onboarding Auth/Profile services. This document captures the REST, GraphQL, and tRPC interfaces that every client (web, iOS, Android, concierge tooling) can rely on while the durable services (`onboarding-auth-service.ts`, `onboarding-profile-service.ts`) continue to evolve.

- **AuthService scope**: account registration, password + passkey login, magic link fallback, SMS verification, and risk scoring.
- **ProfileService scope**: compatibility drafts, media uploads, profile shells, and plan selection.
- **Parity requirement**: REST is the canonical contract; GraphQL + tRPC resolvers proxy the same service layer without duplicating business logic.

## REST Endpoint Matrix
| Service | Method & Path | Description | Request Schema | Success Response | Notes |
| --- | --- | --- | --- | --- | --- |
| Auth | `POST /api/onboarding/auth/register` | Create applicant credentials + seed onboarding prospect record. | `{ email, password?, passkeyAttestation?, profileDraft? }` | `201` `{ prospectId, nextStep }` | Supports password _or_ passkey-only registration (password optional when passkey present). |
| Auth | `POST /api/onboarding/auth/login` | Exchange password or passkey assertion for session token. | `{ email, password }` or `{ email, passkeyAssertion }` | `200` `{ token, refreshToken, prospectId }` | Passkey assertion uses WebAuthn verification server-side. |
| Auth | `POST /api/onboarding/passkey/challenge` | Issue WebAuthn registration options. | `{ email, prospectId? }` | `200` `{ options, prospectId }` | Already implemented via `startPasskeyRegistration`. |
| Auth | `POST /api/onboarding/passkey/register` | Finalize passkey enrollment. | `{ email, prospectId, attestation }` | `200` `{ verified: true }` | Clears challenge cookie, stamps applicant record. |
| Auth | `POST /api/onboarding/magic-link/request` | Send sign-in link when passkeys unavailable. | `{ email, locale, redirectUri }` | `202` `{ requestId }` | Stores hashed token + expiry, throttled per email/IP. |
| Auth | `POST /api/onboarding/magic-link/confirm` | Consume sign-in link token. | `{ requestId, token }` | `200` `{ token, refreshToken, prospectId }` | Invalid/expired returns `410` with `reason`. |
| Auth | `POST /api/onboarding/verify-phone` | Trigger Twilio Verify SMS. | `{ email, phone, prospectId? }` | `200` `{ prospectId, sid }` | Already live via `sendVerificationCode`. |
| Auth | `PUT /api/onboarding/verify-phone` | Confirm SMS code. | `{ prospectId, phone, code }` | `200` `{ verified: true }` | Already live via `confirmVerificationCode`. |
| Profile | `POST /api/onboarding/profile` | Upsert core profile shell (bio, tribe, preferences). | `{ prospectId, email, profile }` | `200` `{ prospectId }` | Validates age, locale rules, duplicates. |
| Profile | `POST /api/onboarding/compatibility` | Persist compatibility quiz snapshot. | `{ prospectId?, email, personas, values }` | `200` `{ prospectId }` | Already implemented (`upsertCompatibilityDraft`). |
| Profile | `POST /api/onboarding/media/request` | Generate signed upload URL. | `{ prospectId?, email, mediaType, contentType }` | `200` `{ uploadUrl, fileUrl, uploadKey, prospectId }` | Already implemented via `requestMediaUpload`. |
| Profile | `POST /api/onboarding/media/finalize` | Score + store upload metadata. | `{ prospectId, uploadKey, mediaType, aiHints? }` | `200` `{ prospectId, aiScore }` | Already implemented via `finalizeMediaUpload`. |
| Profile | `POST /api/onboarding/plan-selection` | Save plan selection prior to checkout. | `{ prospectId, planId, priceCents, interval }` | `200` `{ prospectId, planId }` | Hooks into billing service later. |

### Standard Error Model
```jsonc
{
  "error": {
    "code": "PHONE_VERIFICATION_FAILED",
    "message": "The code entered is invalid",
    "retryAfterSeconds": 30
  }
}
```
- `code` follows `SCOPE_REASON` (`AUTH_EMAIL_IN_USE`, `PROFILE_INVALID_TRIBE`, etc.).
- 4xx codes indicate client fixes; 5xx bubble unexpected service failures (observability hooks fire PagerDuty).

## GraphQL Contracts
GraphQL API (Apollo Router) exposes type-safe access for native apps and concierge tooling. Each resolver simply forwards to the REST/service methods, preserving validation + telemetry.

```graphql
type Mutation {
  registerApplicant(input: RegisterApplicantInput!): RegisterApplicantPayload!
  loginApplicant(input: LoginApplicantInput!): LoginApplicantPayload!
  startPasskeyRegistration(email: String!, prospectId: ID): PasskeyChallenge!
  finalizePasskeyRegistration(input: FinalizePasskeyInput!): VerificationResult!
  requestMagicLink(email: String!, locale: String, redirectUri: String): MagicLinkRequest!
  confirmMagicLink(input: ConfirmMagicLinkInput!): SessionPayload!
  sendPhoneVerification(input: PhoneVerificationInput!): PhoneVerificationPayload!
  confirmPhoneVerification(input: ConfirmPhoneInput!): VerificationResult!
  upsertProfile(input: ProfileInput!): ProspectPayload!
  saveCompatibilityDraft(input: CompatibilityInput!): ProspectPayload!
  requestMediaUpload(input: MediaUploadInput!): MediaUploadPayload!
  finalizeMediaUpload(input: FinalizeMediaInput!): MediaFinalizePayload!
  savePlanSelection(input: PlanSelectionInput!): PlanSelectionPayload!
}
```

Key type snippets:
```graphql
input RegisterApplicantInput {
  email: String!
  password: String
  passkeyAttestation: JSON
  profileDraft: ProfileInput
}

input LoginApplicantInput {
  email: String!
  password: String
  passkeyAssertion: JSON
}

input MediaUploadInput {
  prospectId: ID
  email: String!
  mediaType: MediaType!
  contentType: String!
}
```

> **Note:** GraphQL returns strongly typed payloads (e.g., `SessionPayload { token, refreshToken, expiresAt, prospectId }`) even though the REST surface returns plain JSON objects. Keep the error codes identical by throwing `ApolloError` with the REST `code` in `extensions.code`.

## tRPC Router Sketch
The member web app consumes tRPC for zero-bundle analytics; the router mirrors GraphQL names but uses input/output Zod schemas.

```ts
export const onboardingRouter = createTRPCRouter({
  registerApplicant: procedure
    .input(registerApplicantSchema)
    .mutation(({ input }) => authService.register(input)),
  loginApplicant: procedure
    .input(loginApplicantSchema)
    .mutation(({ input }) => authService.login(input)),
  requestMediaUpload: procedure
    .input(mediaUploadSchema)
    .mutation(({ input }) => profileService.requestMediaUpload(input)),
  finalizeMediaUpload: procedure
    .input(finalizeMediaSchema)
    .mutation(({ input }) => profileService.finalizeMediaUpload(input)),
  saveCompatibilityDraft: procedure
    .input(compatibilitySchema)
    .mutation(({ input }) => profileService.saveCompatibilityDraft(input)),
})
```
- Shared Zod schemas live in `packages/contracts/onboarding.ts` to guarantee consistency across REST handlers, GraphQL resolvers, and tRPC procedures.

## Data Flow Highlights
1. **Registration**
   - REST: `/api/onboarding/auth/register` validates uniqueness, hashes password when present, seeds `onboarding_applicants` with `status: initiated`.
   - GraphQL/tRPC: forward to the same service, respond with `prospectId` + `nextStep` hint (e.g., `'security'`).
   - Analytics: emit `onboarding.auth.registered` with `{ method: 'password' | 'passkey' }`.
2. **Magic Link**
   - Request endpoint writes `magicLinks` subdocument containing SHA256 token + TTL index (15 minutes). Emails are sent via Resend/SES behind `sendMagicLinkEmail` helper.
   - Confirm endpoint verifies token, invalidates row, then issues access + refresh tokens via `issueOnboardingTokens`.
3. **Phone Verify**
   - Already live. Ensure docs reference existing environment flags; GraphQL resolver wraps `sendVerificationCode`/`confirmVerificationCode`.
4. **Profile Upsert**
   - Accepts partial drafts (bio, maritalStatus, tribe, location). Service normalizes casing, attaches `lastStep: 'profile'`, and prevents under-30 DOBs.
5. **Media Uploads**
   - Already live. Documented clients must pass the same `mediaType` keys (`id`, `selfie`, `voice`, `video`).
6. **Plan Selection**
   - Feeds monetization service later. For now it just stores plan metadata so concierge can nudge prospects.

## Security & Observability
- All REST endpoints require `Origin` allowlist + `x-onboarding-client` header for rate-limiting buckets.
- Responses set `Cache-Control: no-store`.
- Audit fields written to `onboarding_audit_log` collection: `{ prospectId, actor, action, payloadHash, createdAt }`.
- Emit analytics events:
  - `onboarding.auth.registered`
  - `onboarding.auth.login`
  - `onboarding.passkey.enrolled`
  - `onboarding.magic_link.requested`
  - `onboarding.magic_link.confirmed`
  - `onboarding.phone.verified`
  - `onboarding.profile.saved`
  - `onboarding.media.uploaded`
  - `onboarding.plan.selected`

## Implementation Checklist
1. [ ] Scaffold `/api/onboarding/auth/register` + `/login` routes backed by `onboarding-auth-service`.
2. [ ] Create `/api/onboarding/magic-link/request|confirm` routes with email provider integration + TTL indexes.
3. [ ] Add `/api/onboarding/profile` + `/plan-selection` API routes that call `onboarding-profile-service` (compatibility + media routes already done).
4. [ ] Publish shared Zod schemas + generated TypeScript types for clients.
5. [ ] Add GraphQL mutations + tRPC procedures mirroring the REST handlers.
6. [ ] Wire analytics + audit logging to each handler.

Once completed we can mark the Step 8 “Auth/Profile endpoints” subtask as ✅ and unblock mobile onboarding parity.
