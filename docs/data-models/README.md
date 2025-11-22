# Phase 2 Data Models

All MongoDB collections defined in Section 2 of the execution blueprint live in `lib/data/collections.ts`. Validators + indexes are generated from the `CollectionDefinition` interface and applied through `scripts/setup/ensure-collections.ts`.

## Highlights

- ✅ Schemas for users, profiles, compatibility, matching snapshots, interactions, chat, notifications, events, community, safety, billing, analytics, gamification, referrals/advocates, AI recommendations.
- ✅ TTL indexes for expiring artifacts (boosts, rewinds, moderation actions, trust events, liveness, analytics, cohort metrics, ephemeral messages).
- ✅ Compound indexes across critical access paths (user feed, tribe/gender, auction windows, referral tiers, subscription provider pairs).
- ✅ CSFLE candidate map defined in `lib/data/csfle-config.ts` to encrypt PII at rest.
- ✅ Analytics warehouse schema defined in `infra/data/sql/analytics-partitions.sql` for Postgres/Neon partitions.

## Tooling

- `pnpm tsx scripts/setup/ensure-collections.ts` – Applies validators and indexes to Atlas.
- `pnpm tsx scripts/setup/generate-csfle-metadata.ts` – Emits JSON schema for Client-Side Field Level Encryption (store in S3/Vault).
- `infra/data/terraform` – Provisions Atlas + Neon infrastructure.
- `infra/data/sql/analytics-partitions.sql` – Run against Neon to build partitioned tables.
