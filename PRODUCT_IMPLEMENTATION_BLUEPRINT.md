# Tribal Mingle Implementation Blueprint
**Version:** 2.0  
**Date:** November 20, 2025  
**Scope:** Next-generation blueprint for a world-class, multi-platform dating ecosystem that rivals Bumble, Hinge, and Tinder in polish while staying true to tribe-centric differentiation.

---
## 1. Platform Architecture Overview
| Layer | Responsibility | Tech Stack | Key Notes |
|-------|----------------|-----------|-----------|
| Experience – Public Web | Marketing, SEO, editorial, campaigns, waitlists | Next.js 16 App Router (SSR/SSG), Tailwind, shadcn/ui Pro, Contentful CMS, Starlight docs | Edge-rendered, multilingual, AB-tested; integrates live personalization snippets + prefetches app shell |
| Experience – Member App (Web + Native) | Authenticated experience (discovery, chat, subscriptions, events, AI coach) | Shared React component library, Next.js Client islands, Expo/React Native, Zustand + React Query, Wagmi for RTC states | Offline-first caching, deep links, Lottie micro-animations, LaunchDarkly feature flags, biometric unlock on mobile |
| Admin + Ops Studio | Trust & Safety, CRM, growth experiments | Next.js + Radix primitive suite, Ant Design Pro charts, GraphQL + REST clients | Workspace-level RBAC, impersonation, live queues, automation builder |
| API/Service Mesh | Domain microservices (Auth, Profile, Matching, Payments, Messaging) | Node 20, TypeScript, Fastify + tRPC, Apollo GraphQL Federation, gRPC for heavy compute, Socket.IO 5 + LiveKit SFU | Runs on Kubernetes + Linkerd, auto-scaled with HPA, service contracts generated via OpenAPI + Zod |
| Data & Storage | Operational + analytical stores | MongoDB Atlas Global Clusters, Redis Enterprise, Neon/Postgres (analytics), ElasticSearch/Algolia hybrid, AWS S3 + CloudFront, Pinecone vector DB | Multi-region writes, change streams into Kafka/MSK feeding analytics lakehouse |
| Jobs & Stream Processing | Async + ML workloads | BullMQ, Temporal.io (sagas), Kafka Streams, dbt, DuckDB for fast queries | Dedicated worker pool with autoscaling + canary deploys |
| Observability & Tooling | SLO enforcement, diagnostics | Datadog, OpenTelemetry, Sentry, Grafana k6, Backstage developer portal | Error budgets tied to release gates |

---
## 2. Data Model & Storage Strategy
MongoDB remains the system of record with JSON schema validation; analytical replicas land in Postgres/Parquet for BI.

1. **users** – auth + account metadata
   - Core: `_id`, `email`, `phone`, `passwordHash`, `socialProviders[]`, `roles[]`, `status`, `signupSource`, `consentLog[]`
   - Session & devices: `trustedDevices[] { deviceId, pushToken, lastSeenAt, geoHash }`, `mfaFactors[]`, `authRiskScore`

2. **profiles** (1:1)
   - Core identity: `name`, `gender`, `pronouns`, `dob`, `age`, `tribe`, `clan`, `languages[]`, `location { city, country, lat, lng }`
   - Storytelling: `bio`, `iceBreakers[]`, `promptResponses[] { promptId, answer, media }`, `voiceIntro`, `videoIntro`, `mediaGallery[]`, `primaryPhoto`
   - Cultural fit: `culturalValues { spirituality, family, tradition, modernity }`, `faithPractice`, `diet`, `marriageTimeline`, `childrenPreference`
   - Safety/privacy: `verificationStatus { selfie, id, social, background, badgeIssuedAt }`, `visibilitySettings`, `incognitoRules`, `blockedUserIds[]`

3. **compatibility_quizzes** – slider/card responses, ML-ready vectors, persona tags.

4. **matching_snapshots** – persisted candidates per user with metadata `{ rank, scoreBreakdown, generatedAt, algorithmVersion }`.

5. **likes**, **super_likes**, **boost_sessions**, **rewinds** – include device + geo context, dedupe keys, and eventId for analytics.

6. **chat_threads** & **chat_messages** – threads store participants, pinned prompts, P2P encryption keys; messages store `contentType`, `attachments`, `moderationFlags`, `deliveryStatus`, `readBy[]`, `ttl`.

7. **notifications** – unified channel table powering OneSignal, SendGrid, SMS, in-app; track experiments + user engagement.

8. **events**, **event_registrations**, **community_posts**, **community_comments** – support hybrid IRL/virtual events, ticketing, recordings, and community clubhouses.

9. **subscriptions**, **payments**, **invoices**, **entitlements** – store Stripe/Paystack IDs, proration logs, gifts, add-ons, referral credits, promo usage.

10. **gamification_states** – XP, streaks, badge inventory, quests, leaderboard snapshots.

11. **referrals** & **advocates** – track tiers, payout ledger, social share tokens.

12. **reports**, **moderation_actions**, **trust_events** – include AI classifier scores, reviewer notes, evidence bundle references (S3), escalation chain.

13. **analytics_snapshots**, **funnel_metrics**, **cohort_metrics** – partitioned daily, powering admin dashboards.

14. **activity_logs** – immutable append-only log (Mongo + S3 cold storage) with cryptographic hash chaining for audit compliance.

15. **ai_recommendations** – stores AI-generated icebreakers, outfit suggestions, date itineraries, along with success metrics.

---
## 3. Experience & UX Flows
### 3.1 Public Web + Growth Surfaces
- Hero stack with dynamic personalization (server chooses hero variant using geo + referral code).
- Multi-language support (EN, FR, PT, Arabic) with locale-specific imagery, SEO metadata, hreflang tags.
- Sections: immersive tribe map (WebGL), success stories fed by `/api/testimonials`, editorial blog (Contentful), event carousel, pricing with localized currency toggles, trust & press logos, interactive FAQ.
- Lead capture: progressive Waitlist, brand ambassador applications, affiliate microsites.
- Performance: <1s LCP via Next Image CDN, partial hydration, inline critical CSS, prefetching of `/app` shell for returning users.

### 3.2 Member App (Web + Native)
- **App Shell:** Unified header w/ global search, pill nav (Home, Discover, Matches, Chat, Events, Insights, Profile). Mobile gets sticky CTA + haptic micro-interactions.
- **Onboarding:**
  1. Email + phone verification (Twilio Verify + passkeys).
  2. Social proof capture (import from Instagram/LinkedIn optionally).
  3. Cultural onboarding (values slider cards, language preference chips).
  4. Photo/voice/video capture with AI nudges (quality score, background blur suggestions).
  5. Trial funnel surfaces Premium preview; Apple/Google Pay as 1-tap upgrade.
- **Discovery:**
  - Dual mode: swipe stack + “story mode” grid. Real-time match score, trust badges, AI-generated opener suggestions.
  - Filters saved as “recipes”, premium gating for advanced filters (geo radius, faith practice, life goals, zodiac, online now).
  - Boost strip + queue showing upcoming “Spotlight” placements.
- **Matches & Likes:**
  - Reverse matches, curated daily batch, event-based intros, cross-platform sync.
  - “Who liked you” grid with blur overlay for free tier; premium watchlist & prioritize.
- **Chat:**
  - Thread list with statuses (spark, active, snoozed), AI autopilot suggestions, quick replies.
  - Conversation view: voice notes, AR filters, gifts, route-to-video call (LiveKit), translator w/ automatic detection, disappearing timers, message recall, read receipts timeline.
  - Safety prompts warn on suspicious behavior (powered by TrustService).
- **Events & Community:**
  - Discovery calendar, RSVP flows, virtual lobby (spatial audio), event matchmaking tables, host back-office.
  - Community clubs (topic-based), AMA sessions, pinned stories, trending polls.
- **Insights:**
  - KPI tiles (views, likes, replies, compatibility score distribution), interactive charts (7/30/90 days).
  - AI Coach recommending prompts, wardrobe, story ideas. “Apply suggestion” updates profile.
- **Gamification:**
  - XP loops, weekly quests, achievements, leaderboard per tribe, confetti micro-interactions.
- **Subscriptions & Billing:**
  - Plans (Free, Premium, Platinum, Elite Concierge) with curated perks, localized pricing, manage add-ons (Boost packs, Rewinds, Travel mode), invoice download, secure card vault.
- **Settings & Safety:**
  - Privacy toggles (incognito, hide age, blur photo), 2FA, session management, device notifications, data export/delete request, guardian/family approval portal invites.

### 3.3 Admin & Ops Studio
- Modules: Overview, Growth, Trust & Safety, Support, CRM, Content, Events, Revenue, Labs (feature flags), System.
- Overview: live DAU/MAU, funnel drop-offs, revenue heatmap, active experiments, anomaly alerts.
- Trust desk: queues for reports, AI-suspect matches, selfie verification, real-time chat monitors. Side-by-side comparisons, timeline audit, action macros.
- Growth lab: segmentation, lifecycle journeys, triggered campaigns (email/push/SMS), experiment builder tied to LaunchDarkly flags.
- CRM: high-value member management, concierge tasks, call notes, manual match suggestions.
- Events: scheduler, host assignment, ticketing, payout tracking, NPS collection.
- Revenue: cohort analytics, LTV/CAC dashboards, chargeback center, coupon manager.
- System: feature flag toggles, integration secrets, audit logs, Terraform plan view, on-call runbooks.

---
## 4. Services & Domain Logic
### 4.1 Core Services
1. **AuthService** – Passkey + OAuth login, adaptive risk scoring, refresh-token rotation, device fingerprinting, SMS/email OTP, admin 2FA enforcement.
2. **ProfileService** – Schema validation, media moderation (human + AI), S3 signed uploads, auto-captioning, prompt library, persona tagging.
3. **MatchingService** – Hybrid ML + rules engine: cosine similarity on embeddings, cultural heuristics, behavior signals, fairness constraints; publishes `matching_snapshots` to Redis + Mongo.
4. **DiscoveryService** – Query builder w/ Weighted Random Sampling, premium gating, incognito enforcement, caching via Redis + Algolia fallback, Travel Mode and Passport support.
5. **InteractionService** – Likes, super likes, rewinds, match creation; triggers notifications + analytics events.
6. **ChatService** – Thread orchestration, Socket.IO rooms, LiveKit escalations (audio/video), message queue for fan-out, spam detection via ML.
7. **NotificationService** – Templates via SendGrid + MJML, OneSignal push, Twilio SMS/WhatsApp, in-app center; respects quiet hours + preference matrix.
8. **PaymentsService** – Stripe/Paystack integration, Apple/Google Pay, webhooks, proration, tax/VAT, invoice PDFs, ledger + entitlements cache.
9. **EventsService** – Ticket sales, waitlists, reminder sequences, host dashboards, attendance QR scanning, recording uploads.
10. **CommunityService** – Moderated forums, pinned posts, polls, AMA scheduling, trending detection.
11. **GamificationService** – XP distribution, quests, loot tables, reward redemption, fairness checks.
12. **RecommendationService** – AI coach/responses, prompt improvements, outfit/date ideas, experiment tracking.
13. **TrustService** – Real-time content safety (AWS Rekognition, Hive), catfish detection, behavior heuristics, block/ban propagation.
14. **AnalyticsService** – Event ingestion (Segment), warehouse sync, metrics API, insights generator.
15. **SupportService** – Ticket routing, SLA timers, canned responses, Zendesk integration.

### 4.2 Feature Highlights
- **AI Match Coach:** GPT-4o mini fine-tuned model generating compatibility summaries, shareable intros, coaching tips; context-sandboxed per thread.
- **Boost Marketplace:** real-time auction for Spotlight slots, dynamic pricing, usage analytics.
- **Travel Mode:** auto updates discovery radius + city; suggests local events.
- **Family Approval Portal:** external link with limited profile view, approval toggles, comment thread; user notified in-app.
- **Concierge Matchmaking:** high-tier plan gets dedicated human matchmaker workflow inside Admin Studio with suggestions + feedback loops.
- **Safety Net:** Nudges when users attempt to share personal info, auto-warning for suspicious payment requests, easy “panic” button that notifies trust team.
- **Data Export/Delete:** Self-serve GDPR interface, asynchronous job notifying user when ready, available via secure download link.

---
## 5. API Surface (REST + GraphQL + Realtime)
- REST for transactional endpoints, GraphQL Gateway for UI queries, Socket.IO namespaces for chat/presence, Web Push for notifications.
- All responses follow `{ success, data, error, traceId }`; validation via Zod, autogenerated SDK via Orval.

### 5.1 Auth & Identity (REST)
`POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/passkey`, `POST /api/auth/magic-link`, `POST /api/auth/verify-phone`, `POST /api/auth/refresh`, `POST /api/auth/logout`, `GET /api/auth/session`, `POST /api/auth/device/trust`, `POST /api/auth/2fa/setup`.

### 5.2 GraphQL Domains
- **Profile graph:** query `profile(id)`, `matchSuggestions`, `insights`, `events`, `communityFeed`. Mutations for profile updates, media uploads, quiz submission, AI prompt adoption.
- **Admin graph:** query `userSearch`, `reportsQueue`, `experiments`, `revenueCohorts`; mutations for moderation actions, refunds, feature flags.

### 5.3 Realtime Channels
- `chat:*` namespaces for threads, `presence:*` for active indicators, `matchmaker:*` for live event matchmaking, `moderation:*` for admin escalations.

### 5.4 REST Feature Highlights
| Endpoint | Notes |
|----------|-------|
| `POST /api/interactions/like` | Handles like/super-like/rewind, enforces quotas, writes analytics event |
| `POST /api/matches/boost` | Starts boost session, returns placement schedule |
| `GET /api/discover` | Accepts >25 filters, geospatial + Algolia search fallback |
| `POST /api/chat/threads/:id/messages` | Supports text, media, gifts, location pins |
| `POST /api/chat/threads/:id/video` | Creates LiveKit room token |
| `GET /api/events`, `POST /api/events/:id/register`, `POST /api/events/:id/feedback` |
| `POST /api/subscription/checkout`, `POST /api/subscription/webhooks/stripe`, `POST /api/subscription/webhooks/paystack` |
| `GET /api/gamification/state`, `POST /api/gamification/quests/:id/claim` |
| `POST /api/referrals`, `POST /api/referrals/:code/redeem` |
| `POST /api/community/topics/:id/posts`, `POST /api/community/posts/:id/moderate` |
| `GET /api/admin/analytics`, `GET /api/admin/audit-logs`, `POST /api/admin/impersonate` |

---
## 6. Integrations & Partnerships
| Domain | Providers | Purpose |
|--------|-----------|---------|
| Auth & Identity | Clerk/Auth0, Apple/Google, Trulioo | Social login, ID verification, KYC |
| Communications | Twilio Verify + Messaging, OneSignal, SendGrid, WhatsApp Business | OTP, push, email, SMS/WhatsApp campaigns |
| Payments | Stripe, Paystack, Apple Pay, Google Pay, PayPal | Subscriptions, boosts, concierge retainers, refunds |
| Storage & CDN | AWS S3 + CloudFront, Imgix | Media storage, real-time transforms |
| Moderation | AWS Rekognition, Hive, Spectrum Labs | Photo/video/text moderation |
| Analytics | Segment, Mixpanel, Amplitude, Looker, dbt | Event pipeline + BI |
| Monitoring | Datadog, Sentry, PagerDuty | Observability + on-call |
| Search | Algolia + Elastic | Instant search, typeahead |
| AI/ML | OpenAI GPT-4o, Vertex AI, Pinecone | Match coach, embeddings, translation |
| Maps & Travel | Mapbox, Skyscanner, Sherpa | Distance, travel planning, visa tips |
| Marketing | Braze, Branch.io, AppsFlyer | Cross-channel campaigns, attribution, deep linking |
| Support | Zendesk, Intercom, Linear | Ticketing, chat, internal issue tracking |

---
## 7. Background Jobs, Pipelines & Automation
| Job | Cadence | Description |
|-----|---------|-------------|
| Match Batch Generator | Hourly + on-demand (boost start) | Runs MatchingService, stores ranked lists, sends push for top picks |
| Real-time Event Stream | Continuous | Kafka -> Temporal orchestrations updating analytics snapshots + feature experiments |
| Engagement Digests | 8 AM local timezone | Personalized emails/push summarizing activity + AI advice |
| Subscription Reconciler | Every 15 min | Syncs Stripe/Paystack invoices, retries failed payments, downgrades on grace expiry |
| Verification Queue | Continuous | Processes selfie/ID submissions, updates badges, escalates to manual review |
| Gamification Reset | Midnight per timezone | Resets quests, awards streak XP, refreshes leaderboards |
| Community Moderation | Continuous | ML pre-filter + human queue for posts/comments |
| Event Reminder & Post-Mortem | 24h/1h before, 2h after | Sends reminders, collects feedback, uploads recording |
| Data Export/Delete | Async | Packages GDPR exports, confirms deletion |
| Analytics Snapshot | Nightly | Writes funnel + cohort metrics to Postgres + Looker |
| Experiment Evaluator | Hourly | Computes experiment significance, surfaces winners to Growth Lab |

Temporal orchestrates multi-step workflows (e.g., concierge onboarding, refunds). BullMQ handles high-volume fan-out jobs; Redis Streams for notification pipelines.

---
## 8. Security, Compliance & Reliability
- **Identity & Access:** OAuth2 + passkeys, risk-based authentication, mandatory admin 2FA, device-binding, short-lived access tokens (15m) + rotating refresh tokens, hardware key support for ops.
- **Authorization:** Centralized policy engine (Cerbos or Oso) enforcing RBAC/ABAC across services; audit logs for every privilege escalation.
- **Data Protection:** MongoDB CSFLE for sensitive fields, envelope encryption for secrets, Vault-managed keys, signed URLs for media, no PII in logs.
- **Privacy & Compliance:** GDPR/CCPA tooling, consent versioning, DSAR automation, SOC2 controls (logging, backups, change management), PCI scope limited to Stripe/Paystack.
- **AppSec:** Secure SDLC, dependency scanning, SAST/DAST, bug bounty program, CSP + helmet headers, template sanitization, WebAuthn, secret rotation.
- **Rate Limiting & Abuse Prevention:** Redis + Sliding Window per-IP + per-account; specific guards on likes/messages/payments; device fingerprinting + TrustService heuristics.
- **Observability:** OpenTelemetry instrumentation, distributed traces with trace IDs returned to clients, proactive alerting on SLO burn rates, synthetic monitoring.
- **Resilience:** Multi-region failover, chaos testing, Circuit breakers (opossum), fallback caches, blue/green + canary deploys via Argo Rollouts.
- **Quality Gates:** Extensive unit/integration tests, Playwright E2E, contract tests for GraphQL/REST, load testing quarterly (k6), release freeze rules when SLO breached.

---
## 9. Delivery Roadmap (12-Month Horizon)
1. **Phase 1 – Foundation (Months 1-3)**  
   - Launch passkey-based onboarding, Twilio Verify, compatibility quiz v1, advanced filters, boost marketplace MVP, Stripe/Paystack checkout + entitlements cache, Socket.IO chat with read receipts, LaunchDarkly integration, baseline admin dashboards.
2. **Phase 2 – Engagement (Months 4-6)**  
   - AI Match Coach, Travel Mode, community clubs, event hosting, gamification quests, “Who liked you” premium unlock, Mixpanel/Looker dashboards, OneSignal push + Braze campaigns, first concierge workflow.
3. **Phase 3 – Trust & Monetization (Months 7-9)**  
   - Photo/video verification with liveness, family approval portal, moderation AI + human workflows, referral tiers, Boost auction, Apple/Google Pay, analytics snapshots + cohort explorer, expanded admin automation.
4. **Phase 4 – Differentiation (Months 10-12)**  
   - AI-powered matchmaking concierge, personalized date planning, AR chat filters, LiveKit group events, B2B tribe partnerships, long-distance toolkit (flight deals + visa tips), advanced retention experiments.

Each epic maps to services, data models, and UI flows above with clear Definition of Done (DoD) including instrumentation, QA, content, and playbooks. Quarterly planning syncs with marketing + ops to ensure coordinated launches.

---
This versioned blueprint establishes Tribal Mingle as a premium, culturally resonant dating platform matching the feature depth, reliability, and polish of industry leaders while retaining its unique tribal lens.
