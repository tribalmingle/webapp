# Onboarding Media Pipeline

_Updated: 2025-11-22_

## Overview
Step 6 of the onboarding flow captures government ID, selfie, voice, and video signals so stewards can verify identity before activating concierge features. The pipeline consists of two API hops per asset (request upload → finalize) plus AI scoring + moderation hooks handled by `onboarding-profile-service.ts`.

Key components:
- **Signed uploads** via `lib/storage/s3.ts#createSignedUpload` (10-minute TTL URLs scoped to `onboarding/<mediaType>` prefixes).
- **API routes** `POST /api/onboarding/media/request` and `POST /api/onboarding/media/finalize` (App Router handlers wrapping profile service helpers).
- **Client UX** in `app/sign-up/page.tsx` Step 6 calling `handleMediaSelection` to request URLs, upload blobs, and finalize with optional `aiHints`.
- **Data model** inside `onboarding_applicants.mediaUploads` with `moderation.jobId/status` metadata plus AI scores.
- **Moderation queue** stored in `moderation_jobs` so Rekognition/Hive workers can process uploads asynchronously.
- **Moderation worker** (`scripts/moderation-worker.ts`) that polls the queue, simulates partner scoring (until real credentials exist), and feeds steward dashboards.
- **Current policy**: We are not using Rekognition/Hive or any automated moderation partner. Every upload flows into the manual steward queue described below, and automation work remains paused until leadership approves a new vendor.

## Sequence Diagram
```
Browser                API Route                Profile Service            S3
   |                        |                           |                   |
1. |--request upload------->|                           |                   |
   |                        |--requestMediaUpload------>|                   |
   |                        |                           |--createSigned-->  |
   |                        |<---------signed payload---|                   |
   |<-----upload URL--------|                           |                   |
2. |--PUT blob to S3------------------------------------------------------->|
3. |--finalize upload------>|                           |                   |
   |                        |--finalizeMediaUpload----->|                   |
   |                        |                           | updates Mongo     |
   |<--ai score/status------|                           |                   |
```

## Request Endpoint
- **Route**: `POST /api/onboarding/media/request`
- **Body**: `{ prospectId?, email, mediaType: 'id'|'selfie'|'voice'|'video', contentType }`
- **Response**: `{ uploadUrl, fileUrl, uploadKey, fields?, prospectId }`
- **Behavior**:
  - Creates/updates applicant record with email + timestamps.
  - Pushes a `mediaUploads` entry with `status: 'requested'`.
  - Returns S3 form data (URL + fields) and canonical `prospectId` for downstream calls.
  - Future enhancement: include `maxSizeBytes` + `expiresAt` for UI warnings.

## Finalize Endpoint
- **Route**: `POST /api/onboarding/media/finalize`
- **Body**: `{ prospectId, uploadKey, mediaType, aiHints? }`
- **Response**: `{ prospectId, aiScore }`
- **Behavior**:
  - Computes quick AI score (`calculateMediaScore`) using hints (`aiHints.quality`) or defaults (0.8 selfie / 0.7 others).
   - Derives status: `aiScore >= 0.6 → approved`, otherwise `flagged`.
   - Updates `mediaUploads.$` entry with `status`, `aiScore`, `scoredAt`, and `lastStep: 'media'`.
   - Automatically enqueues a job into `moderation_jobs` with `status: pending`, partner selection (`MEDIA_MODERATION_PARTNER`, defaults to `rekognition`), and references back to the applicant record.
   - Moderation worker later stamps the `mediaUploads.$.moderation` block with partner scores/flags so stewards can decide whether to escalate.

## Client Responsibilities
1. Request upload only when `formData.email` is set (we gate by email today).
2. Use the signed URL + `fetch(args)` to upload with the right headers.
3. Call finalize endpoint and update UI state with returned `fileUrl`, `aiScore`, and `status`.
4. Revoke prior `blob:` URLs to avoid memory leaks (handled via `useEffect` cleanup already).
5. Provide user-facing messaging when status === `flagged` (e.g., “retake selfie”).
6. Emit analytics events `onboarding.media.uploaded` (success) and `onboarding.media.failed` (error) once the analytics SDK is wired.

## Moderation & Steward Roadmap
- `moderation_jobs` collection mirrors each upload; the worker stub remains available but does not call any external partner today.
- Display steward feedback in Step 6 once `mediaUploads.$.moderationNotes` or `insights` exist (UI already shows flagged banners).
- For voice/video, eventually layer in liveness detection (Amazon Voice ID / Deepware) once we resume automation budgets; until then, stewards rely on manual review scripts.

## Manual Steward Review (Step 8 fallback)
When automation cannot fully verify an applicant, stewards work the manual queue directly inside the admin dashboard.

- **Service layer**: `lib/services/moderation-review-service.ts` lists jobs (aggregating `moderation_jobs` with `onboarding_applicants`) and records reviewer decisions while stamping `mediaUploads.$` metadata.
- **Admin APIs**:
   - `GET /api/admin/moderation/jobs?limit=25&status=pending,retry,processing` → returns queue items with applicant email, media type, AI score, partner, and latest media status/message.
   - `PATCH /api/admin/moderation/jobs/:jobId` with `{ resolution: 'approve' | 'reject' | 'request_reshoot', note? }` → marks the job `completed`, logs reviewer info, and updates the applicant record (status/message + moderation note).
- **Resolution mapping**: `approve` ⇒ media + moderation status `approved`; `reject` ⇒ media flagged/rejected; `request_reshoot` ⇒ media flagged with “needs reshoot” copy. Custom notes override default messaging.
- **Admin UI**: Trust & Safety tab now shows a **Verification media queue** card. Stewards can:
   1. Click **Refresh queue** to pull the latest pending jobs via the admin API.
   2. Inspect previews (ID/selfie renders inline, voice/video offer native players) plus metadata chips (AI confidence, partner, retry count, prospect ID, media status).
   3. Choose **Approve**, **Reject**, or **Request reshoot**. Each action prompts for an optional note that is persisted to `mediaUploads.$.moderation.note`.
   4. Watch the success banner confirm submission; the queue refreshes automatically once the API call completes.
- **Audit tie-in**: Reviewer email + timestamp are stored both on the moderation job (`resolvedBy`, `resolvedAt`) and the applicant media entry (`moderation.reviewedBy`, `moderation.reviewedAt`).

## Failure Handling
| Stage | Failure | Client Action |
| --- | --- | --- |
| Request | 400 invalid type/contentType | Show inline error “Unsupported media type.” |
| Upload | 403 expired link | Re-run request endpoint automatically once, surface toast if second failure. |
| Finalize | 404 missing uploadKey | Retry request/upload pair; if still failing, file Sentry issue. |
| AI score | `< 0.6` flagged | Keep preview visible, show remediation copy, allow retake. |

## Instrumentation
- Log success + error metrics via `console.debug('onboarding.media.*')` placeholder until analytics client lands.
- Add `mediaUploads.status` counts to onboarding funnel dashboards.
- Capture average `aiScore` per media type for steward dashboards.

## Next Steps
1. Publish a steward SOP (checklists, SLAs, escalation paths) to align everyone on the manual-only flow.
2. Notify applicants (email + in-product banners) when a steward records a manual decision or requests a reshoot.
3. Backfill analytics events per upload stage.
4. Add this document to the concierge + mobile onboarding handoff packet.
