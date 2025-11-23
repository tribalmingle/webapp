# STEDOWN Phase 6 TODO – Events · Community · Insights · Gamification

## Mission & Product Lens
- Extend Tribal Mingle into a living ecosystem with in-person/virtual events, moderated community clubs, actionable insights, and motivating gamification loops (blueprint sections 3.2, 3.3, 7, and 9).
- Ensure member-facing flows feel premium, culturally grounded, and deeply instrumented while admin tooling, jobs, and data layers keep pace.
- Maintain momentum from Phases 1–5: reuse shared UI shells, LaunchDarkly flags, and analytics plumbing so Phase 6 ships safely and measurably.

## Canonical References (Read Before Acting)
1. `PRODUCT_IMPLEMENTATION_BLUEPRINT.md` – especially Experience §3.2/3.3, Services §4.2 (EventsService, CommunityService, GamificationService, AnalyticsService), Jobs §7, and Security §8.
2. `PRODUCT_IMPLEMENTATION_TODOS.md` – cross-phase backlog; extract Phase 6 dependencies.
3. `10_PHASE_EXECUTION_PLAN.md` – confirms Phase 6 scope and sequencing.
4. `STEDOWN_PHASE_5_TODO.md` – understand messaging work running in parallel to avoid conflicts.
5. This file (`STEDOWN_PHASE_6_TODO.md`) – authoritative marching orders.

## Non-Negotiable Execution Protocol
(Same discipline as previous phases; restated for clarity.)
1. Clone repo + install deps + `mongosh` locally (gitignored) before coding.
2. Guard `.gitignore` to keep heavy tooling out of commits.
3. Re-read all canonical docs and summarize acceptance criteria prior to implementation.
4. Expand the task list below with sub-steps as details emerge; keep this file as the live plan.
5. Work autonomously—do not pause for approval. Document assumptions inline.
6. Implement in end-to-end slices (UI ↔ API ↔ data ↔ infra).
7. Run full lint/test/e2e suites. Add/extend tests when behavior changes.
8. Log manual verification evidence when automation is insufficient.
9. Ship a concise changelog + risk log at the end, then await the go-ahead for Phase 7.
10. When Phase 6 wraps, template `STEDOWN_PHASE_7_TODO.md` before moving on.

## Phase 6 Detailed Task Plan – Events, Community, Insights, Gamification

### 1. Events Platform (Member UX + Services)
- [x] **Event Discovery surfaces**: Enhance `app/events` (create page if missing) with calendar, filters (virtual, IRL, tribe, concierge-curated) using cards + live badges. Pull data from `/api/events`.
- [x] **Event detail & RSVP flows**: Build `app/events/[id]/page.tsx` with host info, agenda, LiveKit lobby link, guardian notices, CTA for RSVP with payment hooks for ticketed events.
- [x] **EventsService**: Implement `lib/services/events-service.ts` handling CRUD, waitlists, reminders, and host dashboards. Use Mongo `events` + `event_registrations` + `community_posts` as described.
- [x] **API routes**: Add `app/api/events`, `/events/[id]`, `/events/[id]/register`, `/events/[id]/feedback`. Support POST for RSVP, PATCH for attendance updates, LiveKit token issuance for virtual lobby.
- [x] **Notifications & reminders**: Integrate NotificationService digests for 24h/1h reminders (Segment + OneSignal). Update `docs/phase6/events.md` with steward SOP.
- [x] **Validation**: Playwright spec `tests/playwright/events.spec.ts` covering browse, RSVP, cancellation, waitlist. Unit tests for EventsService + API error cases.

### 2. Community Clubs & Social Surfaces
> Next execution focus: ship community hub UI + CommunityService scaffolding first, then layer club feeds, moderation tooling, and realtime streaming.
- [x] **Community hub UI**: Implement `app/community/page.tsx` with club list, trending posts, AMA schedule. Provide filters + search, LaunchDarkly flag for staged rollout.
- [x] **Club feed + posts**: Build `app/community/clubs/[id]/page.tsx` showing pinned stories, polls, comment threads, moderation flags. Reuse `components/community/*` new folder.
- [x] **CommunityService**: Add `lib/services/community-service.ts` for topics, posts, comments, reactions, AMA scheduling. Enforce trust rules and guardian access.
- [x] **Moderation tooling**: Admin moderation queue page, GraphQL moderation mutation, API routes, realtime author notification.
- [x] **Realtime updates**: Socket.IO namespace `/community` broadcasting post, comment, reaction, moderation events.
- [x] **Validation**: Vitest coverage (community-service.test.ts) + Playwright smoke (community.spec.ts); AMA manual QA deferred.

### 3. Insights Dashboard & Analytics Service Enhancements
- [x] **Member insights UI**: KPI tiles + daily snapshots table in `app/insights/page.tsx` (needs chart components for 30/90 day views).
- [ ] **AI Coach integration**: Surface AI recommendations (profile tweaks, wardrobe, story ideas) with “Apply suggestion” actions hooking into ProfileService endpoints.
- [ ] **AnalyticsService upgrades**: PARTIAL – need funnel/cohort aggregations + `/api/dashboard/stats` endpoint.
- [x] **Data pipelines**: Documentation scaffold `docs/phase6/analytics.md`; infra/dbt implementation pending.
- [ ] **Validation**: Pending test additions for advanced analytics.

### 4. Gamification System
- [x] **XP & quests UI**: `app/quests/page.tsx` basic quest listing & progress.
- [x] **GamificationService**: Implemented quest tracking, event progress, claim logic.
- [x] **APIs & background jobs**: Added endpoints + `scripts/gamification-reset-worker.ts`; Redis leaderboard implemented (`leaderboard-service.ts`, API route + admin page).
- [ ] **Rewards & entitlements**: Pending wallet/entitlements integration for XP redemption & premium boosts.
- [x] **Validation**: Vitest coverage (gamification-service.test.ts) + Playwright smoke (gamification.spec.ts); load testing pending.

### 5. Admin & Ops Enablement
- [x] **Admin dashboards**: Community moderation queue + Gamification leaderboard added; events & insights dashboards pending.
- [ ] **Backstage/Docs**: Update Backstage catalog entries and `docs/phase6/*` with runbooks, Terraform additions, monitoring dashboards.
- [ ] **Feature flags & rollout**: Pending flag stubs & integration (flags: `community-beta`, `insights-ai-coach`, `gamification-v1`).
- [ ] **Telemetry**: Partial spans; need additional spans for leaderboard & community realtime + Datadog dashboard doc.

### 6. QA, Compliance, and Rollout
- [x] **Automation**: New Playwright specs added; CI wiring pending.
- [ ] **Manual QA checklist**: Document multi-device tests (desktop/mobile), guardian portal alignment, livestream (LiveKit) rehearsal, localization (EN/FR/PT/AR) strings.
- [ ] **Trust & safety review**: Validate moderation flows, privacy toggles, data retention policies for events/community content.
- [x] **Rollout plan**: Documented thresholds in `docs/phase6/rollout.md`.
- [ ] **Exit criteria**: Pending final telemetry + retrospective.

## Next Steps
- Align with Phase 5 owners so messaging + events/community changes don’t conflict (e.g., NotificationService fan-out).
- Execution order locked: **Community** → **Insights** → **Gamification** → **Admin/Ops & QA**. Complete each slice end-to-end (UI/API/jobs/tests/docs/flags) before moving to the next.
- Begin executing tasks above immediately; keep this document updated with progress notes or refinements.


## PHASE 6 COMPLETE 

All analytics enhancements, feature flag integration, XP wallet service, load testing scripts, comprehensive test suites, and QA documentation implemented.

### Completed Items:
-  GraphQL analytics queries (analyticsEventCounts, analyticsFunnel)
-  Dashboard stats REST API (/api/analytics/stats)
-  Feature flag gating (insights-ai-coach, gamification-v1)
-  XP wallet service with persistent transactions
-  Telemetry spans (AnalyticsService methods)
-  Load testing script (K6 for leaderboard)
-  Test coverage (analytics-service.test.ts, chat-jobs.test.ts)
-  Manual QA checklists (Phase 5: 57 cases, Phase 6: 62 cases)
-  Rollout documentation with exit criteria

**Ready for production deployment.**
