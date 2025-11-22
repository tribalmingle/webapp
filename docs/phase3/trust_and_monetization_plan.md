# Phase 3 – Trust & Monetization Implementation

## Objectives
- Launch family/guardian oversight experiences so members can request support and reviews during onboarding.
- Ship premium monetization levers (referral tiers, boost auctions, Apple/Google Pay readiness) atop the data models finished in Phase 2.
- Operationalize safety automation (photo/video liveness, moderation workflows) with audit trails and AI signals.
- Deliver self-serve analytics surfaces (snapshots, cohort explorer) inside the admin studio.

## Initial Deliverables
1. **Family Portal (MVP)**
   - New `/[locale]/family-portal` marketing + onboarding page describing safeguards, FAQs, and invite CTA.
   - Request workflow stub that will later hook into onboarding API.
   - Analytics instrumentation placeholder for future Segment events.
2. **Liveness Verification Foundation**
   - UI copy + state machine design for photo/video capture.
   - API contract outline for moderation service + fallback manual review queue.
3. **Referral Tiers & Boost Auction Specs**
   - Pricing tables, credit ledger rules, and admin toggles documented for implementation.
4. **Payments Expansion**
   - Apple Pay/Google Pay configuration matrix + environment flags.

## Milestone 3.1 – Family Portal Launch
- Shipping goal: release family portal landing page with localized content, trust badges, and CTA to start the guardian flow.
- Success metrics: % of onboarding users inviting a guardian, time-on-page, conversion to invite flow.
- Dependencies: existing marketing dictionary for localization, new copy blocks defined in `dictionaries/`.

### Guardian Invite Request Stub
- Endpoint: `POST /api/guardian-invites/request` (accepts `application/json` and `form-data`).
- Required fields: `memberName`, `contact` (email or WhatsApp), `locale`. Optional: `context`, `regionHint`.
- Response: `{ success: true, requestId, status }` or `{ success: false, errors }` on validation failure.
- Storage: `guardian_invite_requests` collection with default status `received`, metadata for IP, user agent, and timestamps so future onboarding services can claim work.
- Instrumentation: server logs with structured payload + Segment placeholder event `family-portal.invite.submit` once analytics is wired.

## Open Questions
- Liveness provider choice (Onfido vs. in-house) and whether video capture stays client-side or through native handoff.
- Legal review for guardian access to limited profile data.
- Boost auction pricing rules per locale vs. global.

## Liveness Verification Spec (Phase 3 Deliverable #2)

### Why now
- Trust KPI dependency: members with verified photo + video convert to paid plans 22% faster and trigger 63% fewer safety reports.
- Guardian invites and referral tiers both require a verified identity backdrop; we need a reusable pipeline before monetization levers ship.

### Capture Flow Overview
1. **Eligibility gate** (web + mobile web): check member session, ensure profile onboarding is >= step 3, and confirm camera permissions.
2. **Photo selfie**: member aligns face within guide; we capture PNG + depth metadata and store encrypted blob in `verification_artifacts` (new S3 bucket or GCS equivalent).
3. **Video prompt**: randomized 3-word phrase (“Kilimanjaro Sunrise”) ensures real-time capture; 6-second MP4 recorded via MediaRecorder with fallback to native handoff.
4. **Document scan (optional)**: if LaunchDarkly flag `liveness.require_document` is on, we prompt for ID front/back.
5. **Review state**: optimistic UI shows “Pending trust team review” while background job calls provider webhooks and internal heuristics.

### State Machine
```
idle
  -> capturing_photo
  -> capturing_video
  -> uploading_assets
  -> awaiting_provider (async webhook/cron)
  -> verification_passed | verification_failed | needs_manual_review
```
- Retries: allow 2 loops back to `capturing_video` before forcing manual review.
- Manual queue: route to Trust Desk via `trust_events` entry with `eventType=liveness_manual_check`.

### API Contracts
1. `POST /api/trust/liveness/session`
   - Body: `{ device: 'web'|'ios'|'android', intent: 'onboarding'|'guardian_invite', locale }`
   - Response: `{ sessionId, uploadUrls: { photo, video, idFront?, idBack? }, expiresAt }`
   - Side-effects: creates session doc with TTL (15 min), emits Segment event `liveness.session.started`.
2. `POST /api/trust/liveness/session/{sessionId}/complete`
   - Body: `{ artifacts: { photoUrl, videoUrl, idFrontUrl?, idBackUrl? }, metrics: { brightness, faceMatches, numAttempts } }`
   - Validates signed URLs, persists metadata, enqueues provider job, returns `{ status: 'awaiting_provider' }`.
3. Provider webhook `/api/trust/liveness/provider-webhook`
   - Accepts provider-specific payload, normalizes to `{ sessionId, decision: 'pass'|'fail'|'fallback', confidence, reasons[] }`.
   - On `fallback`, auto-create manual review task; on `fail`, notify member via email + in-app Banner.

### Data Model & Storage
- **Collection**: `liveness_sessions` (new) storing session metadata, memberId, attempt counters, provider decision, artifacts references, audit trail.
- **S3 buckets**: `tm-liveness-photo` + `tm-liveness-video` with 15-minute pre-signed URLs, encrypted at rest (SSE-KMS key `tm/trust`).
- **Feature flags**: LaunchDarkly keys `liveness.require_document`, `liveness.video_phrase_set`.

### Moderation & Manual Review
- Build small admin panel widget (Phase 3.3) powered by `liveness_sessions` to show artifacts, provider confidence, autop-run rules (e.g., background mismatch, low light, audio desync).
- Manual reviewers submit `resolution` (`approve`, `reject`, `request_reshoot`) + notes; events logged to `activity_logs` for audit.

### Metrics / Analytics Hooks
- Segment events: `liveness.session.started`, `liveness.session.completed`, `liveness.provider.decision`, `liveness.manual.reviewed`.
- Dashboard additions: update `analytics_snapshots` ETL to include `liveness_pass_rate`, `avg_time_to_decision`, `reshoot_rate` per locale.

### Dependencies & Next Steps
1. Create `liveness_sessions` collection + ensure script entry.
2. Build session API + upload orchestration (signed URLs via existing file service or new minimal signer).
3. Define provider adapter interface + stub (Onfido vs. in-house) so we can toggle easily.
4. Draft UX copy + error states for reshoot, permissions, timeout.
5. Connect manual review queue to Trust Desk (maybe reusing `guardian_invite_requests` metadata pattern).

## Referral Tiers & Boost Auction Spec (Phase 3 Deliverable #3)

### Objectives
- Turn word-of-mouth (already 18% of signups) into a structured incentive ladder.
- Launch pay-as-you-go visibility boosts without rebuilding subscriptions.
- Provide admin controls inside Studio for dynamic pricing and regional experiments.

### Referral Tiering Model
| Tier | Requirement (rolling 90d) | Member Reward | Guardian/Family Reward | Notes |
| --- | --- | --- | --- | --- |
| Bronze (default) | 0-1 successful referrals | +1 boost credit on each successful invite | Optional guardian invite priority | Baseline for all members |
| Silver | 2-4 successful referrals | 1 month premium light or 5 boost credits | Family portal concierge call | Includes badge + priority trust review |
| Gold | 5+ successful referrals | Cash-equivalent payout or 1 premium year (region-based) | Guardian stipend (optional) | Requires compliance check + tax profile |

- “Successful referral” = invitee completes onboarding + passes liveness.
- Credits ledger stored in `referrals` doc; payouts mirrored in `entitlements`/`payments` when cash issued.
- LaunchDarkly flags: `referrals.gold_payout_enabled`, `referrals.guardian_bonus_enabled` to gate high-cost perks.

### Referral Flow Updates
1. **Member Dashboard Card** – shows tier progress bar, referral code, share links.
2. **Invite API** – extend existing `/api/referrals/invite` (to be built) with guardian email optional field for dual rewards.
3. **Tracking** – use `Segment` events `referral.invite.sent`, `referral.invite.accepted`, `referral.reward.issued`.
4. **Admin Console** – filter by tier, export CSV of payouts, ability to revoke fraudulent referrals.

### Boost Auction Concept
- Members bid credits (earned via referrals or purchased) for limited “Spotlight” slots.
- Auction windows: 15 minutes rolling per locale (Africa West, Africa East, Diaspora EU, Diaspora NA).
- Highest bidders occupy top 5 placements in discovery carousels for 2 hours.

#### Auction Mechanics
1. Credits priced at $2 (USD equivalent) per credit; referral credits convertible 1:1.
2. Users submit bid via `POST /api/boosts/bid` with `placement`, `bidAmountCredits`, `locale`.
3. Service stores bids in `boost_sessions` (existing) with new fields `bidAmountCredits`, `auctionWindowStart`.
4. Every 15 minutes, worker selects top bids per locale, marks them `active` and deducts credits (new ledger entry in `entitlements`).
5. Non-winning bids auto-refunded (credits returned) unless user opts into auto-rollover.
6. Ops can trigger a manual clearing run locally via `pnpm auction-worker [--now=ISO_TIME]`, which executes the same worker path against all locales.

#### Admin Controls
- LaunchDarkly flag `boosts.auction_enabled` per locale.
- Config table `boost_auction_settings` (could live in LaunchDarkly JSON) specifying max winners, min bid, currency conversions.
- Dashboard chart: average clearing price, total credits burned, referral-sourced vs purchased credits.

### Data & API Requirements
- Extend `referrals` schema with `tier`, `rolling90dCount`, `lastRewardIssuedAt`.
- New `referral_reward_events` collection (lightweight) or reuse `activity_logs` for audit.
- Update `entitlements` to support `source: 'referral' | 'auction'` for boost credits.
- Build `/api/referrals/progress` (GET) and `/api/referrals/invite` (POST).
- Build `/api/boosts/bid` and `/api/boosts/admin/window` (for debugging upcoming auctions).

### Metrics & Experimentation
- KPIs: referral-to-paid conversion, avg. credits per member, boost conversion to matches.
- Segment events: `boost.bid.submitted`, `boost.auction.cleared`, `boost.auction.refunded`.
- Experiments: ability to A/B clearing price floors in LaunchDarkly by locale.

### Next Steps
1. Finalize referral rewards legal review (cash payout vs. credits by region).
2. Implement referral progress API + dashboard widget in member app.
3. Add credits ledger + bid placement APIs, reusing `entitlements`/`boost_sessions`.
4. Ship admin tools for monitoring tiers and auctions.

## Next Steps
1. Implement Family Portal landing page + dictionary entries.
2. Draft API/interface document for liveness verification.
3. Extend analytics dashboards to surface referral tier performance.
