# Going Live Plan (Web + Mobile)

## Goal
Single-source parity plan so mobile (tmapp, Expo) matches web feature set, all APIs are wired for production, and both App Store and Play Store launches are prepared.

## Current State Snapshot
- Web (Next.js): Live feature surface includes auth, onboarding/profile setup, discovery/swipe/matching, messaging, boosts/subscriptions/payments (Stripe), referrals, guaranteed dating, community/events, concierge, dating tips, safety, notifications, admin tools.
- Mobile (tmapp, Expo Router): UI skeleton present (auth, 13-step setup, tabs for home/discover/matches/chat/profile, premium, community, concierge, tips, safety, settings). Screens use static/demo data; API calls, state sync, payments, push, and deep-link flows are not yet wired. Shared theme components exist but may not fully mirror web tokens.

## Parity Gaps to Close (mobile vs web)
- Auth: Refresh/revoke, device fingerprinting, rate limits; align paths to backend contract.
- Profile setup: Persist each step; media upload (photo/selfie/ID) with progress/retry; location capture; verification status polling; server-driven validation/errors; profile fetch/delete; profile views tracking POST/GET.
- Discovery/swipe/matching: Use backend discovery endpoint (likely /users/discover); paginate; compatibility; exhausted state; align like/pass/superlike endpoints; match creation handling; today’s matches.
- Messaging: Align endpoints to backend contract; media send; typing/receipts if available; unread counts; pagination; background refresh on push.
- Likes/matches: Incoming likes, sent likes, views; accept/decline; path alignment (/likes/i-liked|liked-me vs current); blurred states for free.
- Notifications: Device-token endpoint alignment; fetch list; mark read/read-all; deep-link routing; in-app toasts.
- Premium/payments/boosts: Plans fetch; Stripe intents; Apple/Google Pay; boosts/spotlight windows and bids; entitlements and cooldowns.
- Guaranteed dating/concierge: Intake/status/refund/feedback; concierge intake/status; SLA banners.
- Community/events/tips/referrals/wallet: Lists, detail, join/leave/RSVP, tips list/detail, referral code/status/invite, wallet balance/transactions/purchase.
- Safety/reporting: Report, block, unblock, blocked list; safety tips; session invalidation on block; device checks.
- Settings: Preferences/filters; privacy (pause/hide/read receipts/distance); notifications toggles; account deletion.
- Observability: Error logging, analytics events, feature flags/remote config alignment with web; QA matrix.

## Work Plan (before coding, get approval on this doc)
1) Foundations
- Align theme tokens (colors/spacing/typography/borders/shadows) with web variables; centralize in src/theme and reuse across components.
- Finalize universal components: background, header, bottom nav, cards, buttons, inputs, form field wrappers.
- Define env/config loading for API base URLs, Stripe publishable key, push sender keys.

2) Auth + Session
- Wire signup/login/reset/OTP flows to backend endpoints; store tokens in SecureStore; attach auth headers via axios interceptors; add token refresh/logout; blocklist on logout.
- Add device metadata (platform/app version) to auth calls for security.
- Align endpoint paths to backend contract (e.g., /auth/login vs /auth/signin) and add refresh/revoke.

3) Profile Setup (13 steps)
- Map each step to backend fields; persist on step advance with optimistic UI; handle validation errors per field.
- Implement media uploads (photo/selfie/ID) with presigned URLs or upload endpoints; show progress/retry.
- Capture location; poll verification status; support profile fetch/delete; track profile views (POST/GET); route to tabs on completion.

4) Discovery / Likes / Matches
- Fetch recommendation feed from canonical endpoint (likely /users/discover) with pagination and exhausted-feed handling; show compatibility and verification.
- Actions: like/pass/superlike/save; update local queue; handle match creation and today’s matches; align like/likes-inbox endpoints to backend contract.
- Likes/Matches views: incoming likes, mutual matches, sent likes, recent views; accept/decline; blurred states for free.

5) Messaging
- Align message/thread endpoints to backend contract; add pagination; typing/receipts if available; media send support.
- Delivery: polling cadence plus push-triggered refresh on notification; unread counts; block/report in-thread; background refresh on deep link.

6) Notifications
- Register device token with canonical endpoint (docs: /notifications/device-token); fetch list; mark read/read-all; in-app toasts; deep links to chat/match/profile.
- Migrate to OneSignal per plan; handle foreground/background routing.

7) Premium / Payments / Boosts
- Fetch plans/entitlements; Stripe intents; Apple Pay/Google Pay; purchase and restore; gate premium filters/boosts/superlikes.
- Boosts/spotlight: fetch windows, bid/place, cooldowns, entitlements.

8) Guaranteed Dating / Concierge
- Guaranteed dating: eligibility, request, status, refund, feedback flows; SLA banners.
- Concierge: intake form, status, notes (if supported); escalation handling.

9) Community / Events / Tips / Referrals / Wallet
- Community/Events: list/join/leave tribes; list events; RSVP; reminders; detail pages.
- Tips: list/detail; read tracking.
- Referrals: code/status/invite; apply rewards.
- Wallet: balance/transactions/purchase credits.

10) Settings / Safety / Observability / Release
- Settings: preferences/filters (distance, age, tribe), notifications toggles, privacy (pause/hide/read receipts), account delete.
- Safety: report/block/unblock/blocked list; safety tips; session kill on block.
- Observability: analytics events, error logging with user context, feature flags/remote config; QA matrix.
- Release: EAS builds, store submissions, rollback readiness.

## API Wiring Plan (mobile)
- Transport: axios instance with base URL env, auth header from SecureStore, interceptors for 401→refresh, retry/backoff; react-query for caching/invalidation; feature flags for staging/prod.
- Auth: register/login/OTP/reset endpoints; store access/refresh; profile fetch on app start; logout → revoke token and clear SecureStore; send device/app metadata; align to backend paths.
- Profile setup: step-wise PATCH/POST to profile endpoints; upload helper for images/ID/selfie; geolocation capture; verification status poll; profile fetch/delete; profile views track/read.
- Discovery/likes/matches: GET recommendations (paginated) from canonical endpoint; POST like/pass/superlike; GET likes inbox (incoming/sent); GET views; GET matches/today; POST accept/decline; subscribe to match-created events.
- Messaging: GET thread list; GET thread detail (paged); POST message (text/media); upload media; polling schedule; refresh on push; align endpoints if backend differs.
- Payments/premium/boosts: GET products/plans; POST create payment intent/session; handle Stripe native sheet; POST confirm/consume boost; GET entitlements; fetch spotlight windows/bids.
- Concierge/guaranteed dating: POST concierge request; GET status; POST updates/notes; guaranteed date eligibility/book/status/refund/feedback endpoints.
- Community/events: GET communities; POST join/leave; GET events; POST RSVP; reminders.
- Referrals: GET code/status; POST share/claim/invite; apply rewards to account.
- Notifications: POST device token to canonical endpoint; GET notifications; PUT read; PUT read-all; process notification payload to route user.
- Wallet: GET balance/transactions; POST purchase credits.
- Settings/safety: PATCH preferences; POST report/block/unblock; GET blocked list; DELETE account; logout all sessions.

## App Store / Play Store Launch Plan
- Config: Update app.json with name, icon, splash, scheme, deep link prefixes, permissions, bundleIdentifier (iOS) and android.package; set version/build numbers; configure entitlements (push, photos, camera, location); set API envs and Stripe publishable key.
- Builds: Use EAS Build for managed workflow.
  - Android: `eas build -p android --profile production` (configure keystore once).
  - iOS: `eas build -p ios --profile production` (set up ASC API key, provisioning automatically via EAS).
- Submit: `eas submit -p android --latest` and `eas submit -p ios --latest` after store credentials are set.
- Store assets: create listings (titles, descriptions, keywords, privacy URLs), screenshots/video per platform, content ratings, data safety/ATT forms, support/contact info.
- Release checklist: push notifications tested on physical devices; deep links routing; payments in production mode; crash-free smoke on TestFlight/Internal testing; versioned changelog; rollback plan.

## Approvals Needed Before Execution
- Confirm this plan scope and gap list.
- Confirm API base URLs, auth/refresh contract, media upload contract, and payment flows (Stripe + Apple Pay/Google Pay support level).
- Approve feature flag strategy (staging vs production) and analytics providers.
- Approve store metadata ownership (account access, branding assets) and release timeline.

## Deliverables After Approval
- Updated mobile app with full API wiring and parity features.
- Parity checklist marked off in this doc.
- Release-ready EAS build artifacts for Android and iOS, plus submission or handoff package.
- QA report with pass/fail matrix and open issues.

## Decisions and Defaults (current)
- API base: https://tribalmingle.vercel.app/api (mobile points here now; can switch later if needed).
- Chat delivery: polling every ~3s (foreground), with backoff on errors. Socket.IO exists server-side but is not used in mobile yet.
- Push: OneSignal (switch from Expo-only). We will integrate OneSignal SDK; requires OneSignal App ID and REST API key. Expo push not used for production.
- Scheme/deeplinks: current scheme `tmapp`; can revise to tribalmingle:// if desired later.
- Payments: using Stripe test keys for now; live keys/webhook to be added before go-live.

## Pending Inputs (before final go-live)
- Stripe live keys + webhook secret.
- OneSignal App ID and REST API key (for production push).
- Apple Pay merchant ID/cert and Google Pay gateway merchantId (for production wallets) — optional if card-only via Stripe.
- Analytics/error logging keys if desired (Segment/Sentry/Datadog/Branch). Currently blank.
- App Store Connect API key and Google Play service account JSON, or confirmation you will submit builds yourself.

## Credentials Needed From You (so we can keep building while you gather them)
- Stripe: live publishable/secret keys and webhook secret for production charges/intents.
- OneSignal: production App ID and REST API key to register tokens and send pushes.
- Apple: App Store Connect API key (key ID, issuer ID, .p8 file) and Apple Pay merchant ID/certificate.
- Google: Play Console service account JSON for uploads and Google Pay gateway merchantId (if enabling GPay).
- Payments webhooks: public HTTPS endpoint (or tunnel) approved for Stripe webhooks in prod.
- Analytics/observability: keys for Segment/Branch/Sentry/Datadog (or your chosen stack) if you want those wired pre-launch.

## Execution Phases (organized by status)

**Completed**
- Phase 1 — Foundations and Auth
  - [x] Finalize theme tokens and universal components to ensure consistent brand across regions/tribes.
  - [x] Implement axios client with auth interceptors, refresh, retry/backoff; SecureStore for tokens.
  - [x] Wire signup/login/reset/OTP with device/app metadata; load profile on app start; logout + revoke.
  - [x] Define envs (staging/prod) and feature flags for safe rollout.

**In Progress (to finish Phase 4)**
- Phase 4 — Messaging + Notifications (paused; return after Phase 6)
  - Messaging (done):
    - [x] Thread list/detail wired to API; send text; unread counts; receipts shown.
    - [x] Delivery: polling schedule plus push-triggered refresh; in-app toast and deep-link handling to chat/match/profile.
    - [x] Report/block from thread; error toasts in-app (session kill not required for blocker).
  - Messaging (remaining to finish phase):
    - [ ] Align endpoints with backend contract (threads vs messages/:userId); add pagination for long threads.
    - [ ] Add media send/upload support (images/voice) if available server-side.
    - [ ] Typing indicators/read receipts if supported; consolidate status mapping.
  - Notifications (remaining to finish phase):
    - [x] Register device token with canonical endpoint (/notifications/device-token); remove legacy /notifications/register.
    - [x] Fetch notifications list; mark read; mark all read; reflect unread badge in UI.
    - [ ] Integrate OneSignal SDK (App ID/keys), handle foreground/background, route deep links (chat/match/profile).
    - [ ] In-app toasts for new events; coalesce with polling to avoid duplicates.

**Open**
- Phase 2 — Profile Setup + Media (13 steps)
  - [ ] Map each step to backend fields (interests, heritage/tribe, faith, location, bio, preferences) supporting international tribes (Africa, Asia, Americas, etc.).
  - [ ] Implement uploads for photos, selfie, ID with progress/retry; geolocation capture; verification status polling.
  - [ ] Persist on step advance with validation/error surfacing; completion routes to tabs.

- Phase 3 — Discovery, Likes, Matches (real data)
  - [ ] Fetch recommendation feed (paginated) with compatibility scores, tribe labels, verification badges.
  - [ ] Actions: like/pass/superlike/save; empty-feed handling; queue updates; match creation.
  - [ ] Likes/Matches inbox: incoming likes, mutual matches, recent views (if available); accept/decline; open chat on match.

- Phase 5 — Premium, Payments, Boosts, Concierge, Community (paused; return after Phase 6)
  - [ ] Fetch plans/entitlements; Stripe/Apple Pay/Google Pay flows; gate premium filters/boosts/superlikes; purchase/consume with cooldowns.
  - [ ] Concierge and guaranteed dating flows: intake, status, SLA banners.
  - [ ] Community/events: list/join/leave tribes globally; event RSVP/detail/reminders; tips/articles.
  - [ ] Referrals: share codes/links; status/rewards. Safety center flows.

- Phase 6 — Settings, Observability, Release, QA
  - [ ] Settings: preferences/filters (distance, tribe, age), privacy (pause/hide), notifications toggles, account delete.
  - [ ] Observability: analytics (screen, auth, swipe, like, match, send message, purchase), error logging with user context.
  - [ ] QA matrix across iOS/Android devices; staging/prod flag validation; accessibility and layout polish.
  - [ ] EAS production builds, store submissions (App Store/Play Store), rollout plan, rollback readiness.
