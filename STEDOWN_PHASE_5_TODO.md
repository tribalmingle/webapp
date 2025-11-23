# STEDOWN Phase 5 TODO

## Mission & Product Lens
- Deliver a tribe-centric, premium dating ecosystem that matches top-tier apps in polish while highlighting cultural roots, as detailed in `PRODUCT_IMPLEMENTATION_BLUEPRINT.md`.
- Keep experiences unified across marketing site, member app, admin studio, and service mesh so every release reinforces trust, safety, monetization, and delight.
- Ship in alignment with the 10-phase execution roadmap so each phase compounds on the last.

## Canonical References (Read Before Acting)
1. `PRODUCT_IMPLEMENTATION_BLUEPRINT.md` – architecture, data, UX, and service expectations.
2. `PRODUCT_IMPLEMENTATION_TODOS.md` – backlog of cross-cutting work items.
3. `10_PHASE_EXECUTION_PLAN.md` – macro roadmap; use it to confirm current phase goals.
4. `STEDOWN_PHASE_4_TODO.md` (previous phase) – understand completed/remaining context.
5. This file (`STEDOWN_PHASE_5_TODO.md`) – active marching orders.

## Non-Negotiable Execution Protocol
1. **Bootstrap**: clone `https://github.com/tribalmingle/webapp.git`, install dependencies, and install MongoDB Shell (`mongosh`) locally. Keep `mongosh` binaries outside the repo (or within `.tools/` but gitignored) so pushes never include them.
2. **Environment Guardrails**: ensure `.gitignore` continues to exclude heavy tooling; never add `.tools/` artifacts back into Git history.
3. **Context Ingestion**: reread all canonical docs plus the current phase file. Summarize objectives and acceptance criteria before executing.
4. **Plan the Phase**: break Phase 5 into fine-grained, ordered tasks inside this file. Each task must reference user-facing impact, data/service touchpoints, instrumentation, and validation steps.
5. **Do Not Pause For Approval**: once work begins, keep going end-to-end using best judgement. If a decision needs product input, pick the most reasonable option, document it, and move on.
6. **Implementation Loop**: for each task, write code, configuration, and content updates needed; keep commits scoped and descriptive. Maintain comments only where logic is non-obvious.
7. **Testing & Quality**: run relevant linters, unit tests, integration tests, and E2E suites. Address all failures immediately. Add new tests when behaviors change.
8. **Verification**: manually exercise critical flows when automation is insufficient (e.g., onboarding, payments, trust tooling) and log evidence.
9. **Reporting**: after all tasks pass QA, produce a concise changelog plus any risks or follow-ups, then stop to await the next command (typically to proceed to the subsequent phase).
10. **Phase Transition**: when Phase 5 is complete, template a new `STEDOWN_PHASE_7_TODO.md` with identical rigor before starting Phase 7 (Phase 6 is owned by the parallel workspace).

## Prompt To Re-Issue On Fresh Machines
Use the following verbatim whenever spinning up a new workspace so Copilot knows the full brief:

```
You are GitHub Copilot running on a fresh machine. Perform these steps without asking for permission and only stop when every task for the active phase is complete, fully tested, and summarized:

1. Clone https://github.com/tribalmingle/webapp.git and install dependencies (Node 20 + pnpm). Install MongoDB Shell (mongosh) locally via official installers; keep binaries outside Git or inside a gitignored .tools/ directory so pushes never exceed GitHub file limits.
2. Confirm .gitignore excludes heavy tooling; if not, update it before committing anything.
3. Read PRODUCT_IMPLEMENTATION_BLUEPRINT.md, PRODUCT_IMPLEMENTATION_TODOS.md, 10_PHASE_EXECUTION_PLAN.md, and the current STEDOWN_PHASE_X_TODO.md file end-to-end. Extract the mission, constraints, and acceptance criteria.
4. For the active phase (starting with Phase 5), expand the STEDOWN_PHASE_X_TODO.md file into a detailed, step-by-step plan. Each step must be actionable, cover engineering + content + infra needs, and list the validation you will run when done.
5. Execute every step in order. Use best judgement for any product or technical decision; do NOT pause to ask questions. Document assumptions inline.
6. After implementation, run the full relevant test matrix (unit, integration, E2E/Playwright, lint). Fix every failure immediately.
7. When all work and tests pass, produce a final report summarizing changes, validation performed, and any follow-up risks, then stop and wait for the next instruction (e.g., to begin the next phase).
```

## Phase 5 Detailed Task Plan – Messaging & Social Interactions

### 1. Inbox Surfaces & Filtering (Completed)
Implemented segmented inbox folders (Spark, Active, Snoozed, Trust), search, verified and translator-ready filters, preferences persistence, and Playwright coverage via `messaging-inbox.spec.ts`. Deferred items: formal UX doc and analytics event enumeration.

### 2. Conversation View Upgrades (Pending)
- [ ] **Voice notes + media bar**: Extend `app/chat/[userId]/page.tsx` composer to support audio capture (Web Audio API) and quick media attachments. Store metadata in `chat_messages` with `contentType: 'voice' | 'gif' | 'gift'` and S3 references via `lib/storage/s3.ts`.
  - Impact: unlocks richer storytelling (voice, gifts) so culturally significant cues travel beyond text, boosting replies.
  - Data/Services: update `chat_messages` schema + uploader pipeline to include waveform duration, locale, storage keys, moderation flags, and TTL for expiring audio.
  - Instrumentation: log `chat.voice_note.record_started/completed/sent` plus attachment size metrics for storage guardrails.
  - Validation: cross-browser manual QA (Chrome/Safari/Edge) verifying microphone permissions + fallback UI; unit tests for media bar state machines.
- [ ] **LiveKit escalation**: Add CTA inside conversation header that calls new route `app/api/chat/threads/[id]/video/route.ts`. Server issues LiveKit token via `lib/services/chat-service/livekit.ts` (new file). Update client to auto-open modal using LiveKit React SDK.
  - Impact: members escalate promising chats to face-to-face faster without leaving the app, reinforcing trust.
  - Data/Services: create API route + LiveKit service helper, ensure entitlements/premium checks + trust verification gating before issuing tokens.
  - Instrumentation: emit `chat.livekit.cta_clicked`, `chat.livekit.room_started`, `chat.livekit.room_failed` with traceIds for SLO tracking.
  - Validation: mocked LiveKit unit tests plus staging verification with real LiveKit room; add graceful fallback when token issuance fails.
- [ ] **Translator panel**: Integrate translation toggle hooking into `lib/services/ai-concierge-service.ts` or new `lib/services/translation-service.ts` (wrapping OpenAI/Vertex). Provide inline bilingual rendering with auto-detect and ability to send translated message.
  - Impact: bilingual rendering removes friction for multicultural matches and ties into premium upsell for advanced translation packs.
  - Data/Services: translation service needs caching, rate limiting, source/target locale detection, and writes `translationState` per message.
  - Instrumentation: capture `chat.translator.enabled`, latency, token usage, and success/error outcomes for budget monitoring.
  - Validation: unit tests mocking translation provider + manual QA for EN↔FR + EN↔AR samples ensuring right-to-left rendering and fallback copy.
- [ ] **Safety nudges**: Display `TrustService` prompts (e.g., sharing financial info) inline using heuristics from `lib/trust/trust-event-service.ts`; log events.
  - Impact: proactive nudges reduce scams and reassure guardians; UI must feel supportive not punitive.
  - Data/Services: wire heuristics to message stream, persist `safetyFlags` on `chat_messages`, feed Nudges component with severity + copy ID.
  - Instrumentation: events `chat.safety_nudge.shown/dismissed/escalated` with trust rule metadata.
  - Validation: snapshot tests verifying themed banners + manual QA to ensure dismissal persists per thread.
- [ ] **Validation**: Vitest component/unit coverage for composer, translator hook, LiveKit CTA; add Playwright test covering audio send, translator usage, safety banner dismissal.
  - Impact: regression suite preserves high-touch flows before enabling premium rollout.
  - Data/Services: add fixture data for translated/voice/safety states plus LiveKit mocks.
  - Instrumentation: ensure Vitest collects coverage for new hooks + components; update CI thresholds if needed.
  - Validation: integrate new tests into `pnpm test` + `pnpm test:e2e`, capturing recordings for release notes.

### 3. ChatService & API Layer (Pending)
- [ ] **Data model extensions**: Update `lib/db/collections.ts` schemas for `chat_threads` and `chat_messages` to include `folders`, `safetyFlags`, `translationState`, `attachments[]`, and TTL for disappearing timers. Run migration scripts under `scripts/setup/ensure-collections.ts`.
  - Impact: guarantees UI state persists server-side so inbox filters, safety escalations, and disappearing timers remain reliable across devices.
  - Data/Services: add schema validation + indexes, ensure migrations populate defaults + backfill existing documents, and update `scripts/setup` to enforce TTL indexes.
  - Instrumentation: log migration progress + anomalies, expose metrics for TTL deletions and folder distribution.
  - Validation: dry-run migrations in staging, add unit tests for schema validators, verify TTL removal via mongosh.
- [ ] **Service logic**: Implement `lib/services/chat-service.ts` (or expand existing) to handle voice payload ingestion, translator requests, LiveKit escalation, and message recall. Ensure rate limiting + quotas via Redis.
  - Impact: centralizes chat policies so premium/int'l members get consistent behavior regardless of client.
  - Data/Services: integrate Redis rate limits, S3 uploader hooks, translation service, LiveKit helper, and TrustService evaluations.
  - Instrumentation: add OpenTelemetry spans + Datadog metrics for each action (voice upload latency, translator tokens, recall attempts).
  - Validation: service-level unit tests w/ dependency mocks + contract tests verifying quotas and recall windows.
- [ ] **Routes & GraphQL**: Update REST endpoints under `app/api/messages/*` plus GraphQL resolvers (`lib/graphql/schema.ts`) to expose new fields/ mutations (e.g., `sendVoiceNote`, `toggleTranslator`, `recallMessage`). Generate client SDK updates if needed.
  - Impact: clients (web, native, admin) can use the richer chat features without divergence.
  - Data/Services: ensure Zod schemas + GraphQL types match new fields, update Orval-generated SDKs, document breaking changes.
  - Instrumentation: include trace IDs + request metadata; audit logs for translator toggles + recalls.
  - Validation: add supertest/Vitest coverage, run GraphQL introspection diff, update Postman collection/OpenAPI docs.
- [ ] **Realtime channels**: Expand Socket.IO namespaces `chat:*` in `lib/services/interaction-service.ts` or new gateway to broadcast typing indicators, translator status, LiveKit invite events. Ensure presence service updates state for multi-device sync.
  - Impact: keeps multi-device experiences consistent (phone + web) and informs guardians/trust staff.
  - Data/Services: extend presence cache, add translator/LiveKit events, ensure Redis adapter scaling.
  - Instrumentation: metrics for events/sec, dropped packets, translator status latency.
  - Validation: integration test harness simulating two clients + verifying event sequencing; load test w/ Socket.IO smoke script.
- [ ] **Validation**: Add unit tests in `tests/api/chat` covering new endpoints, plus integration test verifying socket events via mocked server. Update OpenAPI/Zod contracts.
  - Impact: prevents regressions and guarantees docs stay truthful for partner teams.
  - Data/Services: reuse mocked Mongo/Redis fixtures, capture socket transcripts.
  - Instrumentation: enforce coverage thresholds and add contract test job to CI pipeline.
  - Validation: run `pnpm test --filter api-chat` locally + ensure CI gating.

### 4. NotificationService & Activity Signals (Pending)
- [ ] **Notification templates**: Define new MJML templates for missed voice note, translator suggestion, LiveKit invite, safety alert. Place under `components/email/` (create directory) and wire via `lib/services/notification-service.ts`.
  - Impact: keeps members engaged even when away, reinforcing premium value.
  - Data/Services: add localized copy, dynamic sections for badges + CTA deeplinks, ensure template config stored in NotificationService and respects per-locale settings.
  - Instrumentation: track template/version usage + email dispatch metrics.
  - Validation: Litmus/Parcel visual tests + plaintext fallbacks; verify assets hosted on CDN.
- [ ] **Channel fan-out**: Extend NotificationService to respect quiet hours/prefs stored in `notifications` collection. Implement aggregator job (BullMQ) sending digests for snoozed chats.
  - Impact: prevents notification fatigue while ensuring snoozed threads still get recaps.
  - Data/Services: update Mongo schema for quiet hours + snooze digests, extend BullMQ worker to collate events, ensure OneSignal/SMS/push payloads use same preference matrix.
  - Instrumentation: log `notification.digest.enqueued/sent`, quiet-hour suppress counts, and queue latency.
  - Validation: unit tests for preference resolution; dry-run BullMQ job writing preview logs before enabling fan-out.
- [ ] **Analytics instrumentation**: Emit Segment events (`chat.voice_note.sent`, `chat.livekit.started`, `chat.translator.enabled`, `chat.safety_nudge.shown`). Update `lib/analytics/client.ts` and dashboards definition.
  - Impact: analytics + ops teams can monitor adoption + escalate anomalies quickly.
  - Data/Services: add typed helpers in analytics client, ensure events include member tier, locale, device.
  - Instrumentation: verify Segment batching + error handling; update Looker dashboards definitions under `infra/data/`.
  - Validation: mocked Segment tests ensuring payload shape; manual check in Segment debugger.
- [ ] **Validation**: Unit tests for notification builders, verify instrumentation captured via mocked Segment. Add integration test ensuring quiet hours enforcement.
  - Impact: protects member trust by ensuring quiet hours remain sacred.
  - Data/Services: include fixture data for quiet hours + snoozed threads.
  - Instrumentation: add CI badge for notification coverage.
  - Validation: e2e test hitting notification webhook simulator + verifying suppression logs.

### 5. Trust, Safety, and Compliance Enhancements (Pending)
- [ ] **Moderation pipeline**: Plug audio/text attachments into TrustService (Hive/Spectrum). Update `lib/trust/liveness-provider-dispatcher.ts` or create `lib/trust/chat-safety-service.ts`. Store moderation flags on messages, auto-snooze risky threads.
  - Impact: shields members from harmful content and auto-pauses risky conversations for review.
  - Data/Services: route new attachment types through moderation queue, persist `moderationFlags` + reviewer notes, integrate with TrustService scoring + guardian alerts.
  - Instrumentation: emit `trust.chat.flagged`, include classifier confidence + turnaround times.
  - Validation: sandbox tests hitting Hive/Spectrum mocks, manual QA verifying snoozed thread banner + appeal CTA.
- [ ] **Guardian visibility**: Ensure family portal view consumes new chat data safely. Update `app/[locale]/family-portal/page.tsx` to show flagged chats/approvals.
  - Impact: guardians can review flagged interactions without exposing sensitive content beyond what policy allows.
  - Data/Services: add GraphQL/Admin APIs exposing redacted snippets + trust status, respect locale + permission scopes.
  - Instrumentation: log guardian view + decision events for compliance.
  - Validation: accessibility review (keyboard + screen reader) plus regression tests for guardian flows.
- [ ] **Audit logging**: Append chat interactions + translator decisions to `activity_logs` via `lib/observability/tracing.ts`. Guarantee PII redaction.
  - Impact: creates immutable trail for regulators + internal investigations.
  - Data/Services: ensure log entries hash-chained, redact sensitive fields, include translator provider + reason codes.
  - Instrumentation: monitor log volume + error rates; add alert when redaction fails.
  - Validation: unit tests verifying redaction + hashing; manual sampling to confirm readability.
- [ ] **Validation**: Add compliance unit tests ensuring redaction and guardian rules, plus manual QA script documenting panic button + auto-warning flows.
  - Impact: trust/legal teams rely on this evidence before sign-off.
  - Data/Services: extend compliance test suite with fixtures for guardian + panic scenarios.
  - Instrumentation: store QA script + screenshots in `test-results/trust/`.
  - Validation: run manual tabletop exercise documenting escalation timeline.

### 6. Background Jobs & Storage (Pending)
- [ ] **Message lifecycle jobs**: Create Temporal workflow for disappearing timers and message recall windows. Add BullMQ job to purge expired attachments from S3.
  - Impact: upholds disappearing message promises + privacy commitments.
  - Data/Services: Temporal workflow orchestrates TTL countdowns + recall windows; BullMQ worker scans S3 manifest + deletes expired assets, updating Mongo state.
  - Instrumentation: tracing for workflow executions, metrics for deleted items + failures; alert when backlog grows.
  - Validation: Temporal unit tests + staging dry-run verifying TTL enforcement + S3 purge logs.
- [ ] **Analytics snapshots**: Extend nightly job (Section 7 of blueprint) to include messaging KPIs (response time, voice adoption). Update SQL/dbt definitions in `infra/data/`.
  - Impact: leadership can track messaging health + monetization experiments.
  - Data/Services: update ETL scripts, add dbt models for KPIs, ensure Segment + Mongo exports feed data lake.
  - Instrumentation: Looker dashboards refreshed with new tiles; add data-quality checks for nulls/outliers.
  - Validation: run dbt tests, compare metrics vs manual Mongo queries, document acceptance in analytics changelog.
- [ ] **Storage cost guardrails**: Monitor audio upload size; enforce limits via signed URL policy + CDN caching rules.
  - Impact: prevents runaway S3/CDN spend and keeps members informed when hitting limits.
  - Data/Services: update `lib/storage/s3.ts` to cap size/duration, configure CloudFront cache policies, log rejections.
  - Instrumentation: metrics for average voice note size, rejection count, CDN cache hit rate.
  - Validation: load test uploads at threshold, confirm signed URL denies oversize payloads; review monitoring alerts.
- [ ] **Validation**: Write unit tests for workflows, run dry-run to confirm TTL deletions, update dashboards verifying metrics ingestion.
  - Impact: ensures automation won't silently fail in production.
  - Data/Services: include S3 mock + Temporal test harness.
  - Instrumentation: capture dry-run logs + compare to expectations.
  - Validation: share execution report with infra + analytics leads.

### 7. QA, Rollout, and Documentation (Partial)
- [ ] **Automated suites**: Run `pnpm lint`, `pnpm test`, `pnpm test:e2e` (Playwright) with messaging-specific specs. Add CI job gating merges for socket + LiveKit tests (update `.github/workflows/marketing-app-ci.yml` or new workflow for app).
  - Impact: prevents regressions before phased rollout.
  - Data/Services: ensure workflows install browsers, configure secrets for LiveKit mocks, collect artifacts.
  - Instrumentation: add CI badge + test duration metrics; block merges on failures.
  - Validation: capture successful run log + attach to release notes.
- [ ] **Manual verification**: Log checklist covering multi-device chat sync, translator accuracy (EN↔FR, EN↔AR), LiveKit escalation, safety prompts, notification delivery windows.
  - Impact: verifies human-centric flows automation can't fully cover.
  - Data/Services: use seeded accounts (free, premium, guardian) + device matrix (desktop/mobile) with LiveKit staging room.
  - Instrumentation: store evidence (screenshots, recordings) in `test-results/manual/messaging-phase5/`.
  - Validation: share checklist with trust + concierge leads for sign-off.
- [ ] **Docs & SOPs**: Update `ADMIN_DASHBOARD_README.md`, `EMAIL_SYSTEM_README.md`, `STEDOWN_PHASE_5_TODO.md` (this file) status once tasks complete. Produce steward scripts for trust escalations and concierge chat flows.
  - Impact: keeps ops + concierge teams unblocked on day one.
  - Data/Services: document new admin dashboards hooks, notification templates, and trust escalation macros.
  - Instrumentation: add doc change-log entries referencing PRs.
  - Validation: request acknowledgment from ops leads after doc drop.
- [ ] **Release plan**: Define staged rollout (internal dogfood → concierge members → 25% premium → 100%). Include monitoring thresholds for chat latency (<250ms p95), LiveKit success rate, safety false positives. Document in `docs/phase5/rollout.md`.
  - Impact: controlled rollout mitigates risk + ensures telemetry coverage.
  - Data/Services: specify LaunchDarkly flags, monitoring dashboards, revert levers.
  - Instrumentation: list metrics + alert thresholds required before each stage.
  - Validation: walkthrough w/ leadership; sign-off recorded in rollout doc.

### 8. Exit Criteria Before Moving To Phase 7 (Not Yet Met)
- Inbox folders, conversation upgrades, ChatService, NotificationService, and safety workflows deployed with telemetry + dashboards.
- All automated + manual tests green; QA evidence stored in `test-results/`.
- Knowledge base + SOPs updated; stewardship team briefed.
- `STEDOWN_PHASE_7_TODO.md` bootstrapped with this template (Phase 6 handled elsewhere), ready for Monetization/Settings scope.

Stay disciplined: ingest context, plan deeply, execute relentlessly, test thoroughly, and only then report results.
