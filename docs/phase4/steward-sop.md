# Concierge & Steward SOP – Discovery Boost + Filter Updates

_Last updated: 2025-11-22_

## Purpose
Detail how stewards react when members apply the new discovery filters, boost entries, and AI opener insights delivered in Phase 4.

## Workflow
1. **Monitor boost strip telemetry.**
   - Active boosts appear in the member boost dashboard (`/boosts`).
   - Confirm spotlight placement before promising live concierge nudges.
2. **Concierge prompts.**
   - Review the AI opener + concierge prompt stored on each swipe/story card.
   - When escalating to manual outreach, copy the prompt into Gladys + add guardian-specific notes.
3. **Filter recipes.**
   - Saved recipes sync to `discovery_recipes`. Stewards can fetch via Mongo or `GET /api/discover/recipes`.
   - If a guardian toggles verified-only/guardian-approved, double-check trust badges before scheduling.
4. **Boost-integrated approvals.**
   - Interaction events now emit `boostContext`. If a steward approves a boost manually, set `metadata.autoRollover = true` to keep the strip healthy.
5. **Escalation triggers.**
   - If match score < 0.65 but concierge wants to surface it (e.g., cultural rarity), add a steward note in `matches.metadata.manualLift: true`.
   - Use LiveKit SOP (Phase 4 plan) when group rooms need the same candidates.

## Metrics + Playback
- Matching/Discovery/Interaction services emit OpenTelemetry spans tagged with `userId` and `mode`.
- Datadog dashboard `phase4_discovery.json` (exported via Observability repo) shows feed latency, interaction quota breaches, and boost saturation.
- Sentry breadcrumbs fire on API failures so stewards can screenshot errors for engineering.
