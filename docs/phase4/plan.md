# Phase 4 – Differentiation Implementation Plan

_Last updated: 2025-11-22_

## Objective
Deliver the differentiation features called out in the blueprint: AI concierge workflows, personalized date planning, AR chat filters, LiveKit-powered group events, B2B tribe partnerships, long-distance toolkit, and advanced retention experiments. Every workstream must ship with instrumentation, manual review fallbacks, and SOPs so concierge + ops teams can operationalize the new experiences.

## Workstreams

### 1. AI Concierge Orchestrator
- Build `AIConciergeService` with helpers to produce introductions, checklists, and coaching tasks.
- Expose `/api/concierge/plan` endpoint accepting member context + intent.
- Add `app/concierge/page.tsx` so premium members can request a plan + see concierge follow-ups.
- Persist plans in Mongo (`concierge_plans` collection) for audit + steward collaboration.

### 2. Personalized Date Planning
- Extend the concierge service with date itinerary generation (dining, cultural add-ons, budget hints).
- Integrate map/travel providers (Skyscanner/Sherpa) when keys are available; default to curated static catalog meanwhile.
- Surface itineraries both inside the concierge UI and inside chat quick actions.

### 3. AR Chat Filters & Effects
- Define `ar_filters` metadata (name, description, effect URL, compatibility) and API route for clients.
- Update chat UI to display available filters + apply previews (web-first placeholder while waiting for native renderers).

### 4. LiveKit Group Events
- Create `/api/events/livekit` route to mint ephemeral access tokens for LiveKit stages.
- Build admin scheduler + member view for "Group Connection Rooms" (MVP: embed LiveKit URL + host tips).

### 5. B2B Tribe Partnerships
- Document partner onboarding workflow, data requirements, and revenue share inside `docs/phase4/partnerships.md`.
- Add admin UI placeholder to track partner leads + status (link to CRM integration in Phase 5).

### 6. Long-Distance Toolkit
- Provide landing page with visa tips, flight deal widgets, timezone coordination, and remote date ideas.
- Hook into concierge service so itineraries can reference toolkit resources.

### 7. Retention Experiment Suite
- Create `lib/experiments/retention-suite.ts` to define experiment templates (reactivation drip, AI nudges, guardian outreach).
- Add admin dashboard controls to launch/monitor experiments (Phase 4 scope: backend structures + docs).

## Milestones
1. Foundation (This PR): service scaffolding, API routes, docs, and UI entry points for concierge + toolkit items.
2. Data & Storage: add `concierge_plans`, `partner_accounts`, `retention_experiments` collections (next iteration).
3. Integrations: wire external providers (OpenAI, LiveKit, travel APIs) once credentials + budgets approved.

## Testing & Rollout
- Ship feature-flagged (LaunchDarkly) to ops/pilot cohort first.
- Instrument analytics events: `concierge.plan.requested`, `concierge.plan.completed`, `chat.ar_filter.applied`, `events.livekit.room.joined`, `retention.experiment.triggered`.
- Publish SOPs for stewards + concierge staff.
