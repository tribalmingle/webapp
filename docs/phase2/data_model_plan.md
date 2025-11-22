# Phase 2 – Data Model & Storage Implementation

## Objectives
- Translate blueprint data requirements into concrete MongoDB collections with JSON Schema validation and strict typing for server usage.
- Provide a repeatable bootstrap utility (`scripts/setup/ensure-collections.ts`) to create/update collections, indexes, and validation rules in MongoDB Atlas.
- Deliver TypeScript models + Zod validators so API handlers can enforce the same shapes at runtime.

## Scope for Initial Drop
1. **Operational Collections** – users, profiles, compatibility_quizzes, matching_snapshots, likes, super_likes, boost_sessions, rewinds, chat_threads, chat_messages, notifications, events, event_registrations, community_posts, community_comments, subscriptions, payments, invoices, entitlements, gamification_states, referrals, advocates, reports, moderation_actions, trust_events, ai_recommendations.
2. **Analytics Collections** – analytics_snapshots, funnel_metrics, cohort_metrics, activity_logs (immutable append-only) with archival flags.
3. **Meta** – shared enums (verificationStatus, paymentStatus, quest types, trust sources), timestamp helpers, multi-tenant indexes (userId + createdAt), TTL enforcement for temporal data (rewinds, boost sessions, matching snapshots).

## Assumptions
- MongoDB Atlas cluster already provisioned; script will run with `MONGODB_URI` env.
- CSFLE / multi-region configuration deferred; we note encrypted fields but use plain schema for now.
- Write concern defaults to majority; TTL indexes rely on server clocks.
- We only store minimal PII for now; additional encryption layers will be added when AuthService lands.

## Deliverables
1. `lib/data/schemas.ts` – master registry describing collection name, JSON Schema validator, indexes, TTLs.
2. `lib/data/types.ts` – generated TypeScript interfaces + helper builders (using Zod) for compile-time safety. **Status:** implemented by deriving `CollectionDocument` types from the registry.
3. `scripts/setup/ensure-collections.ts` – executable script (tsx) that iterates schema registry, runs `createCollection` (if missing), applies `collMod` for validators, ensures indexes.
4. Vitest suites validating that:
   - Each schema has `createdAt/updatedAt` rules.
   - TTL-enabled collections include ISO date.
   - Critical compound indexes (users.email unique, profiles userId unique, matches with dedupe) exist.
5. Documentation (this file) summarizing approach + instructions to run `pnpm tsx scripts/setup/ensure-collections.ts`.

### Upcoming Focus: Chat & Inbox Collections
- **chat_threads**
   - Fields: `participants` (array of userId/objectId + role), `type` (spark | concierge | group), `topicId`, `lastMessageAt`, `lastMessagePreview`, `unreadCounts` per participant, `safetyState` (enum) and `encryption` metadata (placeholder until CSFLE rollout).
   - Indexes: unique compound on participant pair for 1:1 threads, GSI on `updatedAt` for inbox ordering, partial index for `safetyState=flagged` to accelerate moderation queues.
- **chat_messages**
   - Fields: `threadId`, `senderId`, `body`, `attachments` (array w/ url+type+size+checksum), `reactions`, `delivery` state (sent/read/failed), `moderationFlags`, `referenceMessageId` (for replies), `ephemeral` metadata, `encryption` block.
   - Indexes: `threadId + createdAt` for retrieval, TTL for ephemeral messages (once feature live), text index on `body` (pending search requirements), partial index for `delivery.readAt` to query unread.
- Shared considerations: audit fields, trust signals (toxicity score, automation tags), braze/notification fan-out hooks, eventual CSFLE coverage for message bodies. These definitions will extend `lib/data/collections.ts` next.

### Notifications & Events (In Progress)
- **notifications**: Deduplicated delivery envelopes storing channel, template, payload, dedupe key, scheduling metadata, and delivery responses with indexes for user feeds, job queues, and uniqueness guarantees.
- **events**: Community/event objects with host arrays, geo/virtual locations, ticketing info, media assets, and moderation state, indexed by slug, start time, and country visibility for discovery APIs.
- **event_registrations**: Participant join records with payment + check-in state, referral attribution, and waitlist/cancellation support enforced by `(eventId,userId)` uniqueness.

### Community & Trust Safety (In Progress)
- **community_posts**
   - Core fields: `authorId`, `clubId` (optional), `visibility`, `body` (rich text + mentions), `media` array, `poll` metadata, `metrics` counters (reactions/comments/shares), `safety` envelope (toxicity, moderation state), and `pinning` info.
   - Indexes: `(clubId, createdAt DESC)` for feeds, `(visibility, createdAt DESC)` for public discovery, text index on `body`, partial index for `safety.state=flagged` for trust tooling.
- **community_comments**
   - Fields: `postId`, `authorId`, `body`, `attachments`, `parentCommentId`, `threadPath` (materialized path), `reactions`, `safety`, `deletedAt`.
   - Indexes: `(postId, threadPath)` for nested retrieval, `(authorId, createdAt)` for moderation lookup, TTL for soft-deleted content (eventual purge) if configured.
- **reports**
   - Fields: `subjectType` (user/post/comment/event/etc.), `subjectRef` (objectId + collection), `reporterId`, `reason`, `details`, `evidence`, `status`, `assignedTo`, `resolution`, `riskScore`.
   - Indexes: `(status, createdAt)`, `(subjectRef.collection, subjectRef.id)`, `(assignedTo, status)`.
- **moderation_actions**
   - Fields: `actorId`, `subjectType`, `subjectRef`, `action`, `policyVersion`, `notes`, `attachments`, `expiresAt`, `automated` flag, `linkedReportId`.
   - Indexes: `(subjectRef.collection, subjectRef.id, createdAt)`, `(actorId, createdAt)`, TTL on `expiresAt` for temporary sanctions metadata cleanup.
- **trust_events**
   - Fields: `userId`, `eventType`, `source` (ai/manual/system), `scoreDelta`, `aggregateScore`, `context`, `relatedIds`, `expiresAt` for decaying strikes.
   - Indexes: `(userId, createdAt)`, `(eventType, createdAt)`, TTL on `expiresAt`.
   - Status: defined in `lib/data/collections.ts` with TTL + bootstrap coverage.

All five collections above are now merged into the registry and enforced through the ensure-collections script/test suite.

### Monetization & Ledgers (In Progress)
- **subscriptions**
   - Fields: `userId`, `planId`, `status` (trial/active/past_due/cancelled), `startAt`, `currentPeriodEnd`, `cancellation` metadata, `billingProvider` (Stripe/Paystack/Apple/Google), `providerCustomerId`, `entitlements` snapshot, `autoRenew` flag.
   - Indexes: `(userId, status)` for account lookups, `(provider, providerSubscriptionId)` unique, TTL for grace-period entries if required.
- **payments**
   - Fields: `userId`, `source` (web/app/event), `providerPaymentId`, `amount` (money struct), `currency`, `status` (requires_action/succeeded/refunded), `lineItems`, `metadata`, `latestWebhook` info.
   - Indexes: unique `(provider, providerPaymentId)`, `(userId, createdAt)` for history, `(status, createdAt)` for reconciliation jobs.
- **invoices**
   - Fields: `userId`, `subscriptionId`, `periodStart`, `periodEnd`, `amountDue`, `amountPaid`, `tax`, `lineItems`, `status`, `dueDate`, `providerInvoiceId`, `pdfUrl`.
   - Indexes: `(subscriptionId, periodStart)` unique to prevent duplicates, `(status, dueDate)` for dunning.
- **entitlements**
   - Fields: `userId`, `source` (subscription/promo/admin), `featureKey`, `quota`, `remaining`, `renewalSchedule`, `expiresAt`, `metadata`, `audit` logs.
   - Indexes: unique `(userId, featureKey, source)`, TTL on `expiresAt` for limited perks, partial index for `remaining > 0` if needed.
- **ledger integrity**
   - Introduce shared `money` object (currency, amountCents) and `providerRef` struct, enforce double-entry behavior in future `ledger_entries` collection.
   - Ensure every monetary collection records `createdAt/updatedAt`, provider linkage, and optional reconciliation state for accounting exports.

All four monetization collections are now defined in `lib/data/collections.ts`, wired into the ensure-collections script, and covered by registry tests.

### Analytics, Gamification, and Recommendations (In Progress)
- **analytics_snapshots**
   - Fields: `type` (activation, retention, revenue), `range` (daily/weekly/monthly), `windowStart`, `windowEnd`, `dimensions` (locale, tribe, plan), `metrics` (generic key/value numbers), `source` (Segment, warehouse), `generatedAt`, `notes`.
   - Indexes: `(type, range, windowStart)` unique, `(dimensions.locale, windowStart)` for dashboards, TTL optional for raw snapshots if moved to warehouse.
- **funnel_metrics**
   - Fields: `funnelId`, `stepOrder`, `stepName`, `audienceFilters`, `counts` (entered, completed, dropOff), `conversionRate`, `windowStart`, `windowEnd`, `experimentKey`.
   - Indexes: `(funnelId, stepOrder, windowStart)` unique, `(experimentKey, windowStart)` for experiment monitoring.
- **cohort_metrics**
   - Fields: `cohortKey`, `cohortDate`, `dimension`, `weekNumber`, `retentionRate`, `revenuePerUser`, `notes`.
   - Indexes: `(cohortKey, weekNumber)` unique, `(dimension, weekNumber)` for slicing.
- **activity_logs**
   - Immutable append-only with `actorId`, `actorType`, `resource`, `action`, `metadata`, `ip`, `userAgent`, `hashChain` for tamper evidence, optional TTL/archive flag.
   - Indexes: `(actorId, createdAt)`, `(resource.collection, resource.id)`, `(hashChain.prevHash)` unique, TTL for `archivedAt` if flagged.
- **gamification_states**
   - Fields: `userId`, `xp`, `level`, `badges`, `quests`, `streak`, `lastResetAt`, `pendingRewards`, `metadata`.
   - Indexes: unique `userId`, `(streak, updatedAt)` for campaigns, partial index for `pendingRewards > 0`.
- **referrals**
   - Fields: `referrerUserId`, `referralCode`, `invitees` array w/ statuses, `bonusStatus`, `sourceCampaign`, `payouts`, `metadata`.
   - Indexes: unique `referralCode`, `(referrerUserId, createdAt)`, partial index for `invitees.status = pending`.
- **advocates**
   - Fields: `userId`, `tier`, `points`, `issuedRewards`, `programId`, `status`, `notes`, `history` entries.
   - Indexes: unique `(programId, userId)`, `(tier, points)` for leaderboard queries.
- **ai_recommendations**
   - Fields: `userId`, `context` (discovery/chat/event), `modelVersion`, `inputSnapshot`, `recommendations` array (targetId + type + score + reason + metadata), `feedback` events, `expiresAt`.
   - Indexes: `(userId, context, createdAt)`, `(modelVersion, createdAt)`, TTL for `expiresAt`.
- **trust/ledger alignment**
   - Analytics + AI stores should reference the same `userId/ObjectId` types, leverage shared enums, and respect data retention (TTL or archive). Activity logs must remain append-only; updates only allowed to add `archivedAt` or `redactedAt` fields.

All analytics, gamification, referral, advocate, and AI recommendation collections above are now part of `lib/data/collections.ts` and enforced via the ensure-collections script + test suite.

## Open Questions / Next Iteration
- Encryption strategy for high-risk fields (phone, payment instrument tokens) once CSFLE keys ready.
- Whether analytics collections remain in Mongo or move to Postgres/Parquet pipeline (blueprint hints at hybrid).
- Seed data strategy for dev/test (fixtures vs. script) – to be defined alongside Phase 3 onboarding work.
