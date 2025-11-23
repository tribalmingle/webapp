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
- [ ] **Notifications & reminders**: Integrate NotificationService digests for 24h/1h reminders (Segment + OneSignal). Update `docs/phase6/events.md` with steward SOP.
- [x] **Validation**: Playwright spec `tests/playwright/events.spec.ts` covering browse, RSVP, cancellation, waitlist. Unit tests for EventsService + API error cases.

### 2. Community Clubs & Social Surfaces
- [ ] **Community hub UI**: Implement `app/community/page.tsx` with club list, trending posts, AMA schedule. Provide filters + search, LaunchDarkly flag for staged rollout.
- [ ] **Club feed + posts**: Build `app/community/clubs/[id]/page.tsx` showing pinned stories, polls, comment threads, moderation flags. Reuse `components/community/*` new folder.
- [ ] **CommunityService**: Add `lib/services/community-service.ts` for topics, posts, comments, reactions, AMA scheduling. Enforce trust rules and guardian access.
- [ ] **Moderation tooling**: Extend TrustService to queue posts/comments for review; add admin routes in `app/admin/community` and GraphQL resolvers for moderation actions.
- [ ] **Realtime updates**: Use Socket.IO namespace `community:*` for live polls/comment streaming; ensure clients subscribe/unsubscribe gracefully.
- [ ] **Validation**: Vitest coverage for CommunityService, Playwright spec verifying post creation, moderation flag, guardian visibility; manual QA script for AMA flow.

### 3. Insights Dashboard & Analytics Service Enhancements
- [ ] **Member insights UI**: Add `app/insights/page.tsx` showing KPI tiles (views, likes, replies, compatibility spread) and interactive charts (7/30/90 days). Use charts from `components/ui/chart.ts`.
- [ ] **AI Coach integration**: Surface AI recommendations (profile tweaks, wardrobe, story ideas) with “Apply suggestion” actions hooking into ProfileService endpoints.
- [ ] **AnalyticsService upgrades**: Expand `lib/services/analytics-service.ts` to aggregate funnel metrics, cohort data, and messaging KPIs from Phase 5. Add endpoints `/api/dashboard/stats`, GraphQL `insights` queries.
- [ ] **Data pipelines**: Update `infra/data/terraform` + dbt models to compute new metrics (events attendance, community engagement). Document in `docs/phase6/analytics.md`.
- [ ] **Validation**: Unit tests for analytics aggregations, snapshot tests for insight charts, manual verification comparing API output to dbt queries.

### 4. Gamification System
- [ ] **XP & quests UI**: Create `components/gamification/*` plus `app/insights` or dedicated `app/quests/page.tsx` to display streaks, badges, leaderboard by tribe.
- [ ] **GamificationService**: Implement `lib/services/gamification-service.ts` managing XP awards, quest definitions, loot tables, redemption, fairness constraints.
- [ ] **APIs & background jobs**: REST endpoints `/api/gamification/state`, `/quests`, `/quests/:id/claim`; nightly reset job (Temporal workflow) and Redis-based live leaderboard cache.
- [ ] **Rewards & entitlements**: Integrate with PaymentsService/Entitlements for boost packs, rewinds. Update `lib/services/payments/wallet-config-service.ts` if needed.
- [ ] **Validation**: Unit tests for XP math, quest claim rules; Playwright spec verifying quest completion UX; load test (k6) for leaderboard endpoint.

### 5. Admin & Ops Enablement
- [ ] **Admin dashboards**: Extend admin app with Events, Community, Insights, Gamification modules (menus, RBAC). Provide queue views, analytics charts, manual overrides.
- [ ] **Backstage/Docs**: Update Backstage catalog entries and `docs/phase6/*` with runbooks, Terraform additions, monitoring dashboards.
- [ ] **Feature flags & rollout**: Configure LaunchDarkly flags per surface (`events-hub`, `community-beta`, `insights-ai-coach`, `gamification-v1`). Provide kill switches.
- [ ] **Telemetry**: Instrument OpenTelemetry spans for new services; update Datadog dashboards for event RSVP latency, community post throughput, XP distribution.

### 6. QA, Compliance, and Rollout
- [ ] **Automation**: Extend CI to run new Playwright suites (events, community, insights, gamification). Ensure coverage thresholds updated.
- [ ] **Manual QA checklist**: Document multi-device tests (desktop/mobile), guardian portal alignment, livestream (LiveKit) rehearsal, localization (EN/FR/PT/AR) strings.
- [ ] **Trust & safety review**: Validate moderation flows, privacy toggles, data retention policies for events/community content.
- [ ] **Rollout plan**: Stage features (internal → concierge → premium → general). Monitor KPIs (event RSVPs, community posts/day, insights adoption rate, daily quests completion). Document thresholds in `docs/phase6/rollout.md`.
- [ ] **Exit criteria**: All telemetry green, SOPs delivered, support team trained, `STEDOWN_PHASE_7_TODO.md` created, and retrospective logged in `PRODUCT_OWNER_REVIEW.md`.

## Next Steps
- Align with Phase 5 owners so messaging + events/community changes don’t conflict (e.g., NotificationService fan-out).
- Begin executing tasks above immediately; keep this document updated with progress notes or refinements.
