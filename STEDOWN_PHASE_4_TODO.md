# STEDOWN Phase 4 TODO – Discovery & Matching Engine

_Last updated: 2025-11-22_

## Objective
Deliver Phase 4 of the 10-phase execution plan: dual-mode discovery surfaces plus the full MatchingService, DiscoveryService, and InteractionService stack (including REST/GraphQL APIs). This phase must end with members experiencing swipe + story mode, advanced filters, real-time match scoring, and boost integrations backed by production-ready services and telemetry.

## Sequenced Tasks

### 1. Discovery Surfaces (UI)
- [ ] Build swipe stack experience with concierge prompts, trust badges, and boost strip entry points.
- [ ] Implement "story mode" grid/cards with cultural context panels and CTA hooks.
- [ ] Add advanced filter drawer (verified-only, faith practice, life goals, travel mode, online-now) with LaunchDarkly gating.
- [ ] Ship filter recipe saving + quick toggles (verified-only, guardian approved, travel mode) persisted per member.
- [ ] Surface live match score + AI opener suggestions inline with each card.

### 2. MatchingService Implementation
- [ ] Generate embeddings for compatibility quiz + behavioral signals; store vectors in `matching_snapshots`.
- [ ] Implement scoring pipeline combining cosine similarity, cultural heuristics, fairness constraints, and boost modifiers.
- [ ] Publish ranked candidate lists to Redis + Mongo with version metadata.
- [ ] Expose service contract (Fastify/tRPC) plus observability hooks (traces, metrics, logs).

### 3. DiscoveryService Implementation
- [ ] Build query builder that merges member preferences, saved recipes, and premium gating.
- [ ] Integrate Redis caching + Algolia fallback for geo + keyword filters.
- [ ] Enforce incognito/passport/travel mode logic and guardian visibility rules.
- [ ] Add trust throttles (block flagged members, enforce pause states).

### 4. InteractionService Implementation
- [ ] Create APIs for likes, super likes, rewinds, and match confirmation with quota checks.
- [ ] Emit analytics events + notification hooks (OneSignal/Email placeholders) per interaction.
- [ ] Update boost strip logic to reflect new interactions and upcoming spotlight windows.

### 5. API & Client Integration
- [ ] REST endpoints: `GET /api/discover`, `POST /api/interactions/like`, `POST /api/interactions/super-like`, `POST /api/interactions/rewind`, `GET /api/matches`.
- [ ] GraphQL resolvers for discovery feed, match suggestions, and match insights.
- [ ] Update member web client (app/discover, app/matches, app/boosts) to consume new endpoints and render scoring details.
- [ ] Ensure deep links/analytics capture new events (e.g., `discover.filter.applied`, `match.score.viewed`).

### 6. Data & Observability
- [ ] Extend `matching_snapshots`, `likes`, `boost_sessions`, and `interaction_events` collections with indexes + TTL policies matching Phase 2 standards.
- [ ] Add OpenTelemetry instrumentation for MatchingService/DiscoveryService and wire dashboards (Datadog/Sentry).
- [ ] Configure feature flags + kill switches for swipe/story mode rollout.

### 7. QA, Launch, SOPs
- [ ] Write Playwright regression flows for swipe + story mode, filter save, and like/super-like flows.
- [ ] Produce steward/concierge SOP outlining how boosts + new filters affect manual workflows.
- [ ] Define rollout plan (internal beta → 10% → 100%) with monitoring thresholds for feed latency, match success, and crash-free interactions.
