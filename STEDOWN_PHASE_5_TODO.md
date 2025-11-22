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
10. **Phase Transition**: when Phase 5 is complete, template a new `STEDOWN_PHASE_6_TODO.md` with identical rigor before starting Phase 6.

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

### 1. Inbox Surfaces & Filtering
- [ ] **Design criteria**: Revisit blueprint section 3.2 (Chat + Insights) to lock UX acceptance criteria (spark/active/snoozed states, safety badges, translator indicators). Document findings in `docs/phase5/messaging-ux.md` (create file).
- [ ] **Segmented inbox implementation**: Update `app/chat/page.tsx`, `app/chat/[userId]/page.tsx`, and supporting components under `components/member/` to render smart folders (Spark, Active, Snoozed, Trust Review) plus pinned prompts. Persist filters/colors in Zustand store (`lib/state/session-store.ts`).
- [ ] **Inbox search & filters**: Introduce `components/member/notifications-menu.tsx` enhancements for keyword search, unread toggle, premium-only filters (verified, translator-enabled). Store preferences in Mongo `chat_threads` metadata.
- [ ] **Validation**: Playwright flow `tests/playwright/discovery.spec.ts` clone into `tests/playwright/messaging-inbox.spec.ts` covering filter switching, search, translator indicator, premium gating. Snapshot updated inbox UI.

### 2. Conversation View Upgrades
- [ ] **Voice notes + media bar**: Extend `app/chat/[userId]/page.tsx` composer to support audio capture (Web Audio API) and quick media attachments. Store metadata in `chat_messages` with `contentType: 'voice' | 'gif' | 'gift'` and S3 references via `lib/storage/s3.ts`.
- [ ] **LiveKit escalation**: Add CTA inside conversation header that calls new route `app/api/chat/threads/[id]/video/route.ts`. Server issues LiveKit token via `lib/services/chat-service/livekit.ts` (new file). Update client to auto-open modal using LiveKit React SDK.
- [ ] **Translator panel**: Integrate translation toggle hooking into `lib/services/ai-concierge-service.ts` or new `lib/services/translation-service.ts` (wrapping OpenAI/Vertex). Provide inline bilingual rendering with auto-detect and ability to send translated message.
- [ ] **Safety nudges**: Display `TrustService` prompts (e.g., sharing financial info) inline using heuristics from `lib/trust/trust-event-service.ts`; log events.
- [ ] **Validation**: Vitest component/unit coverage for composer, translator hook, LiveKit CTA; add Playwright test covering audio send, translator usage, safety banner dismissal.

### 3. ChatService & API Layer
- [ ] **Data model extensions**: Update `lib/db/collections.ts` schemas for `chat_threads` and `chat_messages` to include `folders`, `safetyFlags`, `translationState`, `attachments[]`, and TTL for disappearing timers. Run migration scripts under `scripts/setup/ensure-collections.ts`.
- [ ] **Service logic**: Implement `lib/services/chat-service.ts` (or expand existing) to handle voice payload ingestion, translator requests, LiveKit escalation, and message recall. Ensure rate limiting + quotas via Redis.
- [ ] **Routes & GraphQL**: Update REST endpoints under `app/api/messages/*` plus GraphQL resolvers (`lib/graphql/schema.ts`) to expose new fields/ mutations (e.g., `sendVoiceNote`, `toggleTranslator`, `recallMessage`). Generate client SDK updates if needed.
- [ ] **Realtime channels**: Expand Socket.IO namespaces `chat:*` in `lib/services/interaction-service.ts` or new gateway to broadcast typing indicators, translator status, LiveKit invite events. Ensure presence service updates state for multi-device sync.
- [ ] **Validation**: Add unit tests in `tests/api/chat` covering new endpoints, plus integration test verifying socket events via mocked server. Update OpenAPI/Zod contracts.

### 4. NotificationService & Activity Signals
- [ ] **Notification templates**: Define new MJML templates for missed voice note, translator suggestion, LiveKit invite, safety alert. Place under `components/email/` (create directory) and wire via `lib/services/notification-service.ts`.
- [ ] **Channel fan-out**: Extend NotificationService to respect quiet hours/prefs stored in `notifications` collection. Implement aggregator job (BullMQ) sending digests for snoozed chats.
- [ ] **Analytics instrumentation**: Emit Segment events (`chat.voice_note.sent`, `chat.livekit.started`, `chat.translator.enabled`, `chat.safety_nudge.shown`). Update `lib/analytics/client.ts` and dashboards definition.
- [ ] **Validation**: Unit tests for notification builders, verify instrumentation captured via mocked Segment. Add integration test ensuring quiet hours enforcement.

### 5. Trust, Safety, and Compliance Enhancements
- [ ] **Moderation pipeline**: Plug audio/text attachments into TrustService (Hive/Spectrum). Update `lib/trust/liveness-provider-dispatcher.ts` or create `lib/trust/chat-safety-service.ts`. Store moderation flags on messages, auto-snooze risky threads.
- [ ] **Guardian visibility**: Ensure family portal view consumes new chat data safely. Update `app/[locale]/family-portal/page.tsx` to show flagged chats/approvals.
- [ ] **Audit logging**: Append chat interactions + translator decisions to `activity_logs` via `lib/observability/tracing.ts`. Guarantee PII redaction.
- [ ] **Validation**: Add compliance unit tests ensuring redaction and guardian rules, plus manual QA script documenting panic button + auto-warning flows.

### 6. Background Jobs & Storage
- [ ] **Message lifecycle jobs**: Create Temporal workflow for disappearing timers and message recall windows. Add BullMQ job to purge expired attachments from S3.
- [ ] **Analytics snapshots**: Extend nightly job (Section 7 of blueprint) to include messaging KPIs (response time, voice adoption). Update SQL/dbt definitions in `infra/data/`.
- [ ] **Storage cost guardrails**: Monitor audio upload size; enforce limits via signed URL policy + CDN caching rules.
- [ ] **Validation**: Write unit tests for workflows, run dry-run to confirm TTL deletions, update dashboards verifying metrics ingestion.

### 7. QA, Rollout, and Documentation
- [ ] **Automated suites**: Run `pnpm lint`, `pnpm test`, `pnpm test:e2e` (Playwright) with messaging-specific specs. Add CI job gating merges for socket + LiveKit tests (update `.github/workflows/marketing-app-ci.yml` or new workflow for app).
- [ ] **Manual verification**: Log checklist covering multi-device chat sync, translator accuracy (EN↔FR, EN↔AR), LiveKit escalation, safety prompts, notification delivery windows.
- [ ] **Docs & SOPs**: Update `ADMIN_DASHBOARD_README.md`, `EMAIL_SYSTEM_README.md`, `STEDOWN_PHASE_5_TODO.md` (this file) status once tasks complete. Produce steward scripts for trust escalations and concierge chat flows.
- [ ] **Release plan**: Define staged rollout (internal dogfood → concierge members → 25% premium → 100%). Include monitoring thresholds for chat latency (<250ms p95), LiveKit success rate, safety false positives. Document in `docs/phase5/rollout.md`.

### 8. Exit Criteria Before Moving To Phase 6
- Inbox folders, conversation upgrades, ChatService, NotificationService, and safety workflows deployed with telemetry + dashboards.
- All automated + manual tests green; QA evidence stored in `test-results/`.
- Knowledge base + SOPs updated; stewardship team briefed.
- `STEDOWN_PHASE_6_TODO.md` bootstrapped with this template, ready for Events/Community scope.

Stay disciplined: ingest context, plan deeply, execute relentlessly, test thoroughly, and only then report results.
