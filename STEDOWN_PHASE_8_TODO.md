# STEDOWN Phase 8 TODO

## Mission & Product Lens
- Deliver a tribe-centric, premium dating ecosystem that matches top-tier apps in polish while highlighting cultural roots, as detailed in `PRODUCT_IMPLEMENTATION_BLUEPRINT.md`.
- Keep experiences unified across marketing site, member app, admin studio, and service mesh so every release reinforces trust, safety, monetization, and delight.
- Ship in alignment with the 10-phase execution roadmap so each phase compounds on the last.

## Canonical References (Read Before Acting)
1. `PRODUCT_IMPLEMENTATION_BLUEPRINT.md` – architecture, data, UX, and service expectations.
2. `PRODUCT_IMPLEMENTATION_TODOS.md` – backlog of cross-cutting work items.
3. `10_PHASE_EXECUTION_PLAN.md` – macro roadmap; use it to confirm current phase goals.
4. `STEDOWN_PHASE_7_TODO.md` (previous phase) – understand completed/remaining context.
5. This file (`STEDOWN_PHASE_8_TODO.md`) – active marching orders.

## Non-Negotiable Execution Protocol
1. **Bootstrap**: clone `https://github.com/tribalmingle/webapp.git`, install dependencies, and install MongoDB Shell (`mongosh`) locally. Keep `mongosh` binaries outside the repo (or within `.tools/` but gitignored) so pushes never include them.
2. **Environment Guardrails**: ensure `.gitignore` continues to exclude heavy tooling; never add `.tools/` artifacts back into Git history.
3. **Context Ingestion**: reread all canonical docs plus the current phase file. Summarize objectives and acceptance criteria before executing.
4. **Plan the Phase**: break Phase 8 into fine-grained, ordered tasks inside this file. Each task must reference user-facing impact, data/service touchpoints, instrumentation, and validation steps.
5. **Do Not Pause For Approval**: once work begins, keep going end-to-end using best judgement. If a decision needs product input, pick the most reasonable option, document it, and move on.
6. **Implementation Loop**: for each task, write code, configuration, and content updates needed; keep commits scoped and descriptive. Maintain comments only where logic is non-obvious.
7. **Testing & Quality**: run relevant linters, unit tests, integration tests, and E2E suites. Address all failures immediately. Add new tests when behaviors change.
8. **Verification**: manually exercise critical flows when automation is insufficient (e.g., onboarding, payments, trust tooling) and log evidence.
9. **Reporting**: after all tasks pass QA, produce a concise changelog plus any risks or follow-ups, then stop to await the next command (typically to proceed to the subsequent phase).
10. **Phase Transition**: when Phase 8 is complete, template a new `STEDOWN_PHASE_9_TODO.md` with identical rigor before starting Phase 9.

## Prompt To Re-Issue On Fresh Machines
Use the following verbatim whenever spinning up a new workspace so Copilot knows the full brief:

```
You are GitHub Copilot running on a fresh machine. Perform these steps without asking for permission and only stop when every task for the active phase is complete, fully tested, and summarized:

1. Clone https://github.com/tribalmingle/webapp.git and install dependencies (Node 20 + pnpm). Install MongoDB Shell (mongosh) locally via official installers; keep binaries outside Git or inside a gitignored .tools/ directory so pushes never exceed GitHub file limits.
2. Confirm .gitignore excludes heavy tooling; if not, update it before committing anything.
3. Read PRODUCT_IMPLEMENTATION_BLUEPRINT.md, PRODUCT_IMPLEMENTATION_TODOS.md, 10_PHASE_EXECUTION_PLAN.md, and the current STEDOWN_PHASE_X_TODO.md file end-to-end. Extract the mission, constraints, and acceptance criteria.
4. For the active phase (starting with Phase 8), expand the STEDOWN_PHASE_X_TODO.md file into a detailed, step-by-step plan. Each step must be actionable, cover engineering + content + infra needs, and list the validation you will run when done.
5. Execute every step in order. Use best judgement for any product or technical decision; do NOT pause to ask questions. Document assumptions inline.
6. After implementation, run the full relevant test matrix (unit, integration, E2E/Playwright, lint). Fix every failure immediately.
7. When all work and tests pass, produce a final report summarizing changes, validation performed, and any follow-up risks, then stop and wait for the next instruction (e.g., to begin the next phase).
```

## Phase 8 Overview – Admin Studio Modules & Analytics/Support Services

Per the 10-phase execution plan, **Phase 8** focuses on:
- **Admin Studio Dashboard Modules**: Overview, Trust & Safety Desk, Growth Lab, CRM, Events Management, Revenue Analytics, Labs (Feature Flags), System Configuration
- **AnalyticsService Enhancement**: Event ingestion pipeline, metrics API, cohort analysis, funnel visualization, data warehouse sync
- **SupportService Implementation**: Ticket routing, SLA timers, canned responses, Zendesk integration, member support portal

---

## Detailed Task Breakdown

### 1. Admin Studio – Overview Dashboard
**User Impact**: Operations team gets real-time health metrics for platform performance, engagement, and business KPIs at a glance.

**Sub-tasks**:
- [ ] **1.1 Overview Dashboard UI** (`app/admin/page.tsx`)
  - Hero metrics cards: DAU/MAU, active conversations, matches today, revenue today
  - 7-day trend sparklines for each metric
  - Active experiments list with current variants and sample sizes
  - Recent alerts/anomalies feed (e.g., spike in reports, drop in signups)
  - Quick links to all other admin modules
  - Data/Services: Query aggregations from MongoDB (users, chat_threads, matches, subscriptions collections), Analytics API
  - Instrumentation: Track admin dashboard page views, metric drill-downs
  - Validation: Dashboard loads <2s, metrics update every 60s via polling or WebSocket, responsive layout

- [ ] **1.2 Overview API Endpoints** (`app/api/admin/overview/route.ts`)
  - `GET /api/admin/overview/metrics` – returns DAU/MAU, conversations, matches, revenue with 7-day trends
  - `GET /api/admin/overview/experiments` – returns active LaunchDarkly experiments with variant distribution
  - `GET /api/admin/overview/alerts` – returns recent anomalies detected by monitoring rules
  - Data/Services: MongoDB aggregation pipelines, LaunchDarkly SDK, AnalyticsService integration
  - Instrumentation: Log API latency, cache hit rates
  - Validation: Unit tests for aggregation logic, integration tests with mock data

- [ ] **1.3 Real-time Updates** (WebSocket namespace `admin:overview`)
  - Socket.IO namespace broadcasting metric updates every 60s
  - Client subscribes on dashboard mount, unsubscribes on unmount
  - Data/Services: Redis pub/sub for metric changes, Socket.IO server
  - Instrumentation: Track WebSocket connection health, message delivery rates
  - Validation: Test connection resilience, verify updates propagate within 60s

---

### 2. Admin Studio – Trust & Safety Desk
**User Impact**: Trust team can efficiently review reports, verify photos, moderate content, and take enforcement actions with full audit trails.

**Sub-tasks**:
- [ ] **2.1 Trust Desk Dashboard** (`app/admin/trust/page.tsx`)
  - Queues: Reports (open/in_progress/resolved), Photo Verification (pending/flagged), Content Moderation (posts/comments)
  - Side-by-side comparison view for verification (uploaded photo vs selfie)
  - Action buttons: Approve, Reject, Escalate, Ban, Warn
  - Timeline view showing user history (reports filed, actions taken, appeals)
  - Bulk action support (e.g., approve 10 verified selfies)
  - Data/Services: TrustService, reports collection, moderation_actions collection
  - Instrumentation: Track queue processing times, action types, escalation rates
  - Validation: E2E test covering report intake → review → resolution, verify audit logs created

- [ ] **2.2 Trust Desk API** (`app/api/admin/trust/route.ts`)
  - `GET /api/admin/trust/reports` – paginated list with filters (status, type, severity)
  - `GET /api/admin/trust/verifications` – pending photo/ID verification queue
  - `POST /api/admin/trust/actions` – apply moderation action (approve, reject, ban, warn)
  - `GET /api/admin/trust/user/:id/history` – full audit trail for a user
  - Data/Services: TrustService methods, MongoDB queries with indexes on status + createdAt
  - Instrumentation: Track action latency, error rates, reviewer productivity metrics
  - Validation: Unit tests for action logic, integration tests with mock reports

- [ ] **2.3 TrustService Enhancements**
  - Add `getReportsQueue(filters)`, `getVerificationQueue()`, `applyModerationAction(actionId, data)`, `getUserTrustHistory(userId)` methods
  - Implement action audit logging to `moderation_actions` collection with reviewer ID, timestamp, reason, evidence
  - Add ML classifier score integration (AWS Rekognition, Hive) for auto-flagging
  - Data/Services: MongoDB transactions for atomic action application, S3 for evidence bundles
  - Instrumentation: Track service method latency, ML score accuracy over time
  - Validation: Unit tests for all TrustService methods, verify audit logs persisted

- [ ] **2.4 Photo Verification Flow**
  - Liveness detection integration (AWS Rekognition DetectFaces with anti-spoofing)
  - Face comparison score threshold (>95% match required)
  - Manual review escalation for borderline cases (85-95% match)
  - Badge issuance workflow updating `profiles.verificationStatus.badgeIssuedAt`
  - Data/Services: AWS Rekognition API, S3 for photo storage, profiles collection
  - Instrumentation: Track verification success rate, manual review rate, processing time
  - Validation: Integration test with sample photos, verify badge updates in DB

---

### 3. Admin Studio – Growth Lab
**User Impact**: Growth team can segment users, design lifecycle campaigns, run A/B experiments, and track conversion funnels without engineering support.

**Sub-tasks**:
- [ ] **3.1 Growth Lab Dashboard** (`app/admin/growth/page.tsx`)
  - User segmentation builder (filters: signup date, plan, activity level, tribe, location)
  - Lifecycle journey canvas (visualize automated campaigns: welcome series, re-engagement, upsell)
  - Experiment builder integrated with LaunchDarkly (create flags, set rollout %, assign cohorts)
  - Funnel visualization (signup → profile complete → first like → first match → subscription)
  - Data/Services: MongoDB aggregations, LaunchDarkly SDK, AnalyticsService funnel queries
  - Instrumentation: Track segment creation, campaign launches, experiment starts
  - Validation: E2E test creating segment → launching campaign → verifying analytics event

- [ ] **3.2 Growth Lab API** (`app/api/admin/growth/route.ts`)
  - `POST /api/admin/growth/segments` – create/update user segment
  - `GET /api/admin/growth/segments` – list all segments with member counts
  - `POST /api/admin/growth/campaigns` – create lifecycle campaign with triggers and templates
  - `GET /api/admin/growth/funnels` – return conversion funnel data (steps, drop-offs, rates)
  - `POST /api/admin/growth/experiments` – create LaunchDarkly flag and experiment config
  - Data/Services: MongoDB for segment persistence, LaunchDarkly API for flag management, AnalyticsService
  - Instrumentation: Track API usage, segment size calculation time, funnel query performance
  - Validation: Unit tests for segment queries, integration tests with LaunchDarkly sandbox

- [ ] **3.3 Segmentation Engine**
  - Implement `SegmentationService` with `createSegment(filters)`, `evaluateSegment(segmentId)`, `getMemberCount(segmentId)` methods
  - Support dynamic filters: plan tier, days since signup, activity score, tribe, location radius, last interaction date
  - Cache segment results in Redis (TTL 5 minutes) for performance
  - Data/Services: MongoDB aggregation pipelines, Redis cache
  - Instrumentation: Track segment evaluation time, cache hit rates
  - Validation: Unit tests for filter combinations, verify counts match manual queries

- [ ] **3.4 Campaign Orchestration**
  - Implement `CampaignService` with `createCampaign(config)`, `scheduleCampaign(campaignId)`, `getCampaignMetrics(campaignId)` methods
  - Support trigger types: time-based (X days after signup), event-based (first match), segment entry
  - Template support for email/push/SMS with variable substitution
  - Integration with NotificationService for delivery
  - Data/Services: campaigns collection in MongoDB, BullMQ for scheduling, NotificationService
  - Instrumentation: Track campaign sends, open rates, click-through rates, conversions
  - Validation: Unit tests for campaign logic, integration test end-to-end campaign flow

---

### 4. Admin Studio – CRM (High-Value Member Management)
**User Impact**: CRM team manages premium members, concierge clients, and VIP relationships with full activity history and task management.

**Sub-tasks**:
- [ ] **4.1 CRM Dashboard** (`app/admin/crm/page.tsx`)
  - Member search and list view (filters: plan tier, LTV, engagement score, concierge status)
  - Member detail view: profile summary, activity timeline, subscription history, notes/tasks
  - Concierge task board: manual match suggestions, call scheduling, follow-up reminders
  - Notes interface with rich text, attachments, @mentions
  - Data/Services: users, profiles, subscriptions collections, CRMService for notes/tasks
  - Instrumentation: Track member searches, note creation, task completion rates
  - Validation: E2E test covering member search → view details → add note → create task

- [ ] **4.2 CRM API** (`app/api/admin/crm/route.ts`)
  - `GET /api/admin/crm/members` – search/filter members with pagination
  - `GET /api/admin/crm/members/:id` – full member profile with activity history
  - `POST /api/admin/crm/notes` – create note attached to member
  - `POST /api/admin/crm/tasks` – create task (match suggestion, call, follow-up)
  - `PATCH /api/admin/crm/tasks/:id` – update task status
  - Data/Services: MongoDB queries, CRMService methods
  - Instrumentation: Track API latency, search performance, task lifecycle metrics
  - Validation: Unit tests for search logic, integration tests with sample data

- [ ] **4.3 CRMService Implementation**
  - New service in `lib/services/crm-service.ts`
  - Methods: `searchMembers(filters)`, `getMemberProfile(userId)`, `createNote(userId, note)`, `createTask(assigneeId, task)`, `updateTask(taskId, update)`
  - Data schema: `crm_notes` collection (userId, authorId, content, attachments[], createdAt), `crm_tasks` collection (assigneeId, type, status, dueDate, relatedUserId)
  - Data/Services: MongoDB with indexes on userId + createdAt
  - Instrumentation: Track note/task creation, task completion SLA metrics
  - Validation: Unit tests for all CRMService methods

- [ ] **4.4 Concierge Workflow**
  - Manual match suggestion interface: side-by-side profile comparison, compatibility override, custom intro message
  - Task types: initial_call, match_suggestion, check_in, renewal_discussion
  - Automated reminders via NotificationService for overdue tasks
  - Data/Services: CRMService, profiles collection, NotificationService
  - Instrumentation: Track concierge match success rate, task completion time
  - Validation: E2E test creating manual match suggestion → member receives notification

---

### 5. Admin Studio – Events Management
**User Impact**: Events team can create events, manage registrations, assign hosts, track attendance, and collect feedback.

**Sub-tasks**:
- [ ] **5.1 Events Management Dashboard** (`app/admin/events/page.tsx`)
  - Event calendar view (month/week/day) with filtering (virtual/IRL, tribe, status)
  - Event creation form: title, description, date/time, location, capacity, ticket price, host assignment
  - Registration list with attendance status, QR code generation for check-in
  - Post-event feedback collection and NPS scoring
  - Data/Services: EventsService, events and event_registrations collections
  - Instrumentation: Track event creation, registration counts, attendance rates, NPS scores
  - Validation: E2E test creating event → viewing registrations → marking attendance

- [ ] **5.2 Events Admin API** (`app/api/admin/events/route.ts`)
  - `POST /api/admin/events` – create event with full details
  - `PATCH /api/admin/events/:id` – update event details
  - `GET /api/admin/events/:id/registrations` – list registrations with attendance status
  - `POST /api/admin/events/:id/check-in` – mark attendee checked in (QR scan or manual)
  - `GET /api/admin/events/:id/feedback` – aggregate NPS and feedback
  - Data/Services: EventsService methods, MongoDB queries
  - Instrumentation: Track API usage, check-in processing time
  - Validation: Unit tests for event CRUD, integration tests with registrations

- [ ] **5.3 EventsService Enhancements**
  - Add admin methods: `createEvent(data)`, `updateEvent(eventId, data)`, `getRegistrations(eventId)`, `checkInAttendee(registrationId)`, `collectFeedback(registrationId, feedback)`
  - Host assignment workflow with notification to assigned host
  - Capacity enforcement preventing over-registration
  - Data/Services: events collection, event_registrations collection, NotificationService
  - Instrumentation: Track event creation rate, capacity utilization, feedback response rate
  - Validation: Unit tests for all admin methods, verify capacity limits enforced

- [ ] **5.4 QR Code Check-In System**
  - Generate unique QR code per registration (JWT signed with registrationId + eventId)
  - QR scanning interface for hosts (mobile-optimized)
  - Real-time attendance tracking with Socket.IO updates
  - Data/Services: JWT signing/verification, event_registrations collection, Socket.IO
  - Instrumentation: Track QR scans, duplicate scan prevention, check-in speed
  - Validation: Integration test generating QR → scanning → verifying attendance updated

---

### 6. Admin Studio – Revenue Analytics
**User Impact**: Finance team can track MRR, LTV, churn, cohort performance, and refund metrics in real-time.

**Sub-tasks**:
- [ ] **6.1 Revenue Dashboard Enhancements** (`app/admin/billing/page.tsx` - already exists from Phase 7)
  - Add LTV by cohort chart (6/12/24 month cohorts)
  - Add refund rate tracking with reason categorization
  - Add ARPU (Average Revenue Per User) trend
  - Add subscription upgrade/downgrade flow visualization (Sankey diagram)
  - Data/Services: MongoDB aggregations, Stripe API for refund data
  - Instrumentation: Track dashboard load time, chart rendering performance
  - Validation: Verify metrics match Stripe dashboard, test with historical data

- [ ] **6.2 Revenue API Enhancements** (`app/api/admin/billing/stats/route.ts`)
  - Add LTV calculation endpoint: `GET /api/admin/billing/ltv?cohort=2024-11`
  - Add refund metrics: `GET /api/admin/billing/refunds?startDate=X&endDate=Y`
  - Add ARPU endpoint: `GET /api/admin/billing/arpu?period=monthly`
  - Add flow analysis: `GET /api/admin/billing/flows?type=subscription_changes`
  - Data/Services: subscriptions, payments, invoices collections, Stripe webhook history
  - Instrumentation: Track query performance, cache effectiveness
  - Validation: Unit tests for LTV/ARPU calculations, verify against manual calculations

- [ ] **6.3 Cohort Analysis Engine**
  - Implement cohort bucketing by signup month
  - Calculate retention curves (% active by month since signup)
  - Calculate revenue curves (cumulative revenue per cohort)
  - LTV projection using exponential smoothing
  - Data/Services: MongoDB aggregations with $bucket and $group, analytics_snapshots collection
  - Instrumentation: Track cohort analysis job runtime, accuracy of projections
  - Validation: Unit tests for cohort logic, compare with known cohort data

- [ ] **6.4 Refund & Chargeback Management**
  - Refund request interface with reason categorization (not_as_described, technical_issue, duplicate, fraud)
  - Stripe refund processing with webhook updates
  - Chargeback tracking and dispute workflow
  - Data/Services: Stripe API, payments collection, refunds subcollection
  - Instrumentation: Track refund processing time, chargeback win rate
  - Validation: Integration test with Stripe test mode, verify refund persisted

---

### 7. Admin Studio – Labs (Feature Flags & Experiments)
**User Impact**: Product team can manage feature rollouts, create A/B tests, and monitor experiment results without engineering deploys.

**Sub-tasks**:
- [ ] **7.1 Labs Dashboard** (`app/admin/labs/page.tsx`)
  - Feature flag list with status (enabled/disabled), rollout percentage, target segments
  - Flag toggle interface with confirmation prompts for production changes
  - Experiment results view: variant distribution, key metrics comparison, statistical significance
  - Flag history timeline showing who changed what and when
  - Data/Services: LaunchDarkly SDK, audit logs, AnalyticsService for experiment metrics
  - Instrumentation: Track flag changes, experiment view counts
  - Validation: E2E test toggling flag → verifying member app behavior changes

- [ ] **7.2 Labs API** (`app/api/admin/labs/route.ts`)
  - `GET /api/admin/labs/flags` – list all flags with current state
  - `PATCH /api/admin/labs/flags/:key` – update flag state or targeting rules
  - `GET /api/admin/labs/experiments/:key` – get experiment results
  - `POST /api/admin/labs/experiments/:key/conclude` – conclude experiment and apply winner
  - Data/Services: LaunchDarkly Management API, AnalyticsService
  - Instrumentation: Track API calls, flag update latency
  - Validation: Integration tests with LaunchDarkly test environment

- [ ] **7.3 LaunchDarkly Integration Enhancements**
  - Implement `FeatureFlagService` wrapping LaunchDarkly Management API
  - Methods: `listFlags()`, `updateFlag(key, patch)`, `getExperimentResults(key)`, `concludeExperiment(key, winnerVariation)`
  - Audit logging for all flag changes to `feature_flag_audit` collection
  - Data/Services: LaunchDarkly SDK, MongoDB for audit logs
  - Instrumentation: Track flag evaluation latency, cache hit rates
  - Validation: Unit tests for FeatureFlagService, verify audit logs created

- [ ] **7.4 Experiment Analysis Pipeline**
  - Integration with AnalyticsService to fetch metrics per variant (conversion rate, engagement, revenue)
  - Bayesian A/B test calculator for statistical significance
  - Automatic winner detection when significance threshold met (95% confidence)
  - Notification to product team when experiment conclusive
  - Data/Services: AnalyticsService, statistical library (jstat), NotificationService
  - Instrumentation: Track experiment runtime, time to significance
  - Validation: Unit tests for statistical calculations, integration test with mock experiment data

---

### 8. Admin Studio – System Configuration
**User Impact**: DevOps and engineering can manage integrations, view audit logs, access runbooks, and monitor system health.

**Sub-tasks**:
- [ ] **8.1 System Dashboard** (`app/admin/system/page.tsx`)
  - Integration status cards (Stripe, Twilio, LaunchDarkly, MongoDB, Redis, S3) with health checks
  - Environment variables viewer (masked secrets) with last updated timestamp
  - Audit log viewer with filters (user, action, resource, date range)
  - On-call runbook library (searchable, categorized by service)
  - System alerts feed (high error rates, service degradation, quota warnings)
  - Data/Services: Health check endpoints, audit_logs collection, Datadog API
  - Instrumentation: Track system dashboard views, health check failure rates
  - Validation: Verify health checks accurate, test audit log filtering

- [ ] **8.2 System API** (`app/api/admin/system/route.ts`)
  - `GET /api/admin/system/health` – aggregated health check for all integrations
  - `GET /api/admin/system/env` – list environment variables (secrets masked)
  - `GET /api/admin/system/audit-logs` – paginated audit logs with filters
  - `GET /api/admin/system/runbooks` – list runbooks with search
  - Data/Services: Integration health checks, MongoDB, environment variables, runbooks from markdown files
  - Instrumentation: Track API latency, audit log query performance
  - Validation: Unit tests for health checks, integration tests with mock services

- [ ] **8.3 Integration Health Checks**
  - Implement health check endpoints for each integration:
    - Stripe: `stripe.customers.list({ limit: 1 })`
    - Twilio: `client.api.accounts.fetch()`
    - MongoDB: `db.admin().ping()`
    - Redis: `redis.ping()`
    - S3: `s3.headBucket()`
    - LaunchDarkly: `ldClient.waitForInitialization()`
  - Return status (healthy/degraded/down), latency, last check timestamp
  - Cache results for 60s to avoid excessive checks
  - Data/Services: Integration SDKs, Redis for caching
  - Instrumentation: Track health check execution time, failure rates
  - Validation: Unit tests for each health check, test with service outages

- [ ] **8.4 Audit Log Enhancements**
  - Centralized audit logging for all admin actions
  - Schema: `{ timestamp, userId, action, resource, resourceId, changes, ipAddress, userAgent }`
  - Indexed on userId, action, timestamp for fast queries
  - Retention policy: 2 years in MongoDB, 7 years in S3 cold storage
  - Data/Services: audit_logs collection, S3 for archival
  - Instrumentation: Track audit log write rate, storage growth
  - Validation: Unit tests for logging helper, verify logs persisted for critical actions

---

### 9. AnalyticsService Enhancement
**User Impact**: Product and growth teams have comprehensive analytics covering user behavior, engagement funnels, and business metrics.

**Sub-tasks**:
- [ ] **9.1 Event Ingestion Pipeline**
  - Implement `AnalyticsService.ingest(event)` method for high-volume event capture
  - Event schema validation with Zod
  - Batching and buffering (flush every 100 events or 10s)
  - Write to MongoDB `analytics_events` collection (partitioned by date)
  - Data/Services: MongoDB time-series collection, BullMQ for async processing
  - Instrumentation: Track ingestion rate, batch size, write latency, validation errors
  - Validation: Load test with 1000 events/s, verify all events persisted

- [ ] **9.2 Metrics API**
  - `GET /api/analytics/metrics` – flexible query API supporting:
    - Metric type (count, sum, average, unique)
    - Event name filter
    - Property filters (userId, plan, tribe, etc.)
    - Date range and granularity (hour, day, week, month)
    - Group by dimensions
  - Response includes data points and metadata (query execution time, sample size)
  - Data/Services: MongoDB aggregation pipelines, Redis cache for frequent queries
  - Instrumentation: Track query complexity, execution time, cache hit rates
  - Validation: Unit tests for query builder, integration tests with sample events

- [ ] **9.3 Funnel Analysis**
  - Implement `AnalyticsService.getFunnelData(steps, filters)` method
  - Support multi-step funnels (e.g., signup → profile_complete → first_like → first_match → subscription)
  - Calculate conversion rates between steps, time to convert, drop-off analysis
  - Support cohort filtering (e.g., users who signed up in November)
  - Data/Services: MongoDB aggregations with $match, $group, $project stages
  - Instrumentation: Track funnel query performance, cache effectiveness
  - Validation: Unit tests with known funnel data, verify conversion rate calculations

- [ ] **9.4 Cohort Analysis**
  - Implement `AnalyticsService.getCohortData(cohortDefinition, metric, retentionPeriod)` method
  - Support cohort definitions: signup date, first purchase date, plan upgrade date
  - Calculate retention curves (% active by period), revenue curves, engagement trends
  - Export cohort data to CSV for further analysis
  - Data/Services: MongoDB aggregations, CSV generation library
  - Instrumentation: Track cohort query performance, export download counts
  - Validation: Unit tests for cohort bucketing, verify retention calculations

- [ ] **9.5 Data Warehouse Sync**
  - Scheduled job (nightly) syncing `analytics_events` to Postgres/Parquet for BI tools
  - Incremental sync using last_sync_timestamp watermark
  - Support for schema evolution (new event properties)
  - Data/Services: MongoDB change streams, Postgres connection, S3 for Parquet files
  - Instrumentation: Track sync job runtime, record counts, schema changes
  - Validation: Integration test verifying events appear in warehouse, test schema changes

---

### 10. SupportService Implementation
**User Impact**: Members can submit support tickets, track resolution progress, and get help via in-app chat. Support team can manage tickets efficiently.

**Sub-tasks**:
- [ ] **10.1 Support Ticket Schema**
  - MongoDB collection `support_tickets` schema:
    - `_id`, `userId`, `status` (open/in_progress/waiting_on_customer/resolved/closed)
    - `priority` (low/medium/high/urgent), `category` (technical/billing/safety/general)
    - `subject`, `description`, `attachments[]`
    - `assignedTo` (support agent ID), `createdAt`, `updatedAt`, `resolvedAt`
    - `slaDeadline` (calculated based on priority), `slaBreach` (boolean)
  - Collection `support_messages` for ticket conversation thread
  - Data/Services: MongoDB with indexes on userId, status, priority, slaDeadline
  - Validation: Schema validation tests, verify indexes created

- [ ] **10.2 SupportService Core Methods**
  - New service in `lib/services/support-service.ts`
  - Methods: `createTicket(userId, data)`, `getTicket(ticketId)`, `updateTicket(ticketId, update)`, `addMessage(ticketId, message)`, `assignTicket(ticketId, agentId)`, `resolveTicket(ticketId)`, `getUserTickets(userId)`
  - SLA calculation: high priority = 2h, medium = 24h, low = 72h
  - Automatic escalation when SLA deadline approaching (notify supervisor)
  - Data/Services: MongoDB, NotificationService for escalations
  - Instrumentation: Track ticket creation rate, resolution time, SLA compliance
  - Validation: Unit tests for all SupportService methods, verify SLA calculations

- [ ] **10.3 Member Support Portal** (`app/help/page.tsx`)
  - FAQ search interface (keyword search across support articles)
  - Ticket submission form with category selection, file upload
  - My Tickets view: list of user's tickets with status, last updated, reply count
  - Ticket detail view: conversation thread, add reply, upload attachments
  - Data/Services: SupportService, support_articles collection for FAQ
  - Instrumentation: Track FAQ searches, ticket submission rate, self-service resolution rate
  - Validation: E2E test creating ticket → adding reply → viewing status

- [ ] **10.4 Support Portal API** (`app/api/support/route.ts`)
  - `POST /api/support/tickets` – create new ticket
  - `GET /api/support/tickets` – get user's tickets
  - `GET /api/support/tickets/:id` – get ticket with messages
  - `POST /api/support/tickets/:id/messages` – add message to ticket
  - `GET /api/support/articles` – search FAQ articles
  - Data/Services: SupportService methods, support_articles collection
  - Instrumentation: Track API usage, ticket creation success rate
  - Validation: Unit tests for ticket CRUD, integration tests with sample data

- [ ] **10.5 Admin Support Desk** (`app/admin/support/page.tsx`)
  - Queue view: open tickets sorted by SLA deadline, priority, created date
  - Filters: status, priority, category, assigned to me
  - Ticket assignment interface with agent selection
  - Canned response library (common answers, customizable before sending)
  - Bulk actions (assign multiple tickets, close resolved tickets)
  - Data/Services: SupportService, canned_responses collection
  - Instrumentation: Track queue processing time, response time, resolution rate
  - Validation: E2E test covering ticket assignment → canned response → resolve

- [ ] **10.6 Admin Support API** (`app/api/admin/support/route.ts`)
  - `GET /api/admin/support/queue` – tickets queue with filters
  - `PATCH /api/admin/support/tickets/:id/assign` – assign ticket to agent
  - `POST /api/admin/support/tickets/:id/resolve` – mark resolved
  - `GET /api/admin/support/canned-responses` – list canned responses
  - `POST /api/admin/support/canned-responses` – create new canned response
  - Data/Services: SupportService methods
  - Instrumentation: Track admin API usage, bulk action performance
  - Validation: Unit tests for queue logic, integration tests with assignments

- [ ] **10.7 Zendesk Integration** (Optional)
  - Bidirectional sync: tickets created in member app sync to Zendesk, replies sync back
  - Webhook handlers for Zendesk ticket updates
  - Mapping between internal ticket IDs and Zendesk ticket IDs
  - Data/Services: Zendesk API, webhooks, ticket_sync_mapping collection
  - Instrumentation: Track sync success rate, latency, error rate
  - Validation: Integration test creating ticket → verifying in Zendesk → syncing reply

---

### 11. Testing & Quality Assurance
**User Impact**: All Phase 8 features ship with high quality, minimal bugs, and comprehensive test coverage.

**Sub-tasks**:
- [ ] **11.1 Unit Tests**
  - Test suites for all new services: CRMService, SupportService, FeatureFlagService, SegmentationService, CampaignService
  - Test coverage >80% for business logic
  - Mock external dependencies (MongoDB, Stripe, LaunchDarkly, Zendesk)
  - Data/Services: Vitest, mock libraries
  - Validation: `pnpm test` passes all unit tests, coverage report generated

- [ ] **11.2 Integration Tests**
  - API endpoint tests for all admin routes (overview, trust, growth, CRM, events, revenue, labs, system, support)
  - Database integration tests with test MongoDB instance
  - External service integration tests (Stripe test mode, LaunchDarkly test environment)
  - Data/Services: Vitest, MongoDB test instance, Stripe test mode
  - Validation: `pnpm test:integration` passes, verify test data cleanup

- [ ] **11.3 E2E Tests (Playwright)**
  - Critical admin workflows:
    - Trust desk: review report → take action → verify audit log
    - Growth: create segment → launch campaign → verify metrics
    - CRM: search member → add note → create task
    - Events: create event → view registrations → mark attendance
    - Support: view queue → assign ticket → add canned response
  - Data/Services: Playwright, test database seeding scripts
  - Validation: `pnpm test:e2e` passes all admin tests

- [ ] **11.4 Load Testing**
  - K6 scripts for high-volume endpoints:
    - `GET /api/admin/overview/metrics` under 1000 req/s
    - `POST /api/analytics/ingest` under 5000 events/s
    - `GET /api/admin/trust/reports` with pagination under load
  - Performance targets: p95 latency <500ms, error rate <0.1%
  - Data/Services: K6, test data generation scripts
  - Validation: Load tests pass performance targets, no memory leaks

- [ ] **11.5 Security Testing**
  - RBAC enforcement tests: verify non-admin users cannot access admin routes
  - Input validation tests: SQL injection, XSS, CSRF protection
  - Rate limiting tests: verify API rate limits enforced
  - Audit log verification: all sensitive actions logged
  - Data/Services: Security testing tools, penetration testing scripts
  - Validation: Security test suite passes, no critical vulnerabilities

---

### 12. Documentation & Rollout
**User Impact**: Operations team can successfully deploy and operate Phase 8 features with clear documentation and runbooks.

**Sub-tasks**:
- [ ] **12.1 Admin User Guide** (`docs/phase8/admin-user-guide.md`)
  - Module-by-module documentation: Overview, Trust, Growth, CRM, Events, Revenue, Labs, System, Support
  - Screenshots for each dashboard with feature callouts
  - Common workflows: investigating user report, launching campaign, managing concierge client
  - Troubleshooting section
  - Data/Services: Markdown documentation, screenshots
  - Validation: Review by operations team, verify accuracy

- [ ] **12.2 API Documentation** (`docs/phase8/api-reference.md`)
  - OpenAPI/Swagger spec for all admin endpoints
  - Request/response examples
  - Error codes and handling
  - Rate limits and pagination details
  - Data/Services: OpenAPI spec generation, Swagger UI
  - Validation: Spec validates, examples work in Swagger UI

- [ ] **12.3 Rollout Plan** (`docs/phase8/rollout.md`)
  - 3-phase rollout: Internal team (Week 1) → Trust/Support pilot (Week 2) → Full ops team (Week 3)
  - Feature flag strategy: admin-studio-v1 flag controlling all Phase 8 features
  - Monitoring dashboard requirements: admin action latency, queue depths, SLA compliance
  - Success metrics: <2s dashboard load time, >90% SLA compliance, <1% error rate
  - Rollback plan: disable feature flag, revert database migrations if needed
  - Data/Services: LaunchDarkly, Datadog dashboards
  - Validation: Rollout plan reviewed, monitoring configured

- [ ] **12.4 Runbooks** (`docs/phase8/runbooks/`)
  - `trust-desk-queue-stuck.md` – troubleshooting stale reports
  - `analytics-ingestion-lag.md` – diagnosing event pipeline delays
  - `support-sla-breach.md` – escalation procedures
  - `health-check-failures.md` – integration troubleshooting
  - `admin-performance-degradation.md` – query optimization
  - Data/Services: Markdown documentation
  - Validation: Review by on-call engineers, verify completeness

- [ ] **12.5 Manual QA Checklist** (`docs/phase8/manual-qa.md`)
  - Comprehensive test cases for all admin modules (60+ cases):
    - Overview dashboard (5 cases): metrics accuracy, real-time updates, alerts
    - Trust desk (10 cases): report review, verification flow, actions, audit logs
    - Growth lab (8 cases): segmentation, campaigns, funnels, experiments
    - CRM (8 cases): member search, notes, tasks, concierge workflow
    - Events (8 cases): creation, registrations, check-in, feedback
    - Revenue (6 cases): MRR, LTV, refunds, cohorts
    - Labs (5 cases): flag toggles, experiments, results
    - System (5 cases): health checks, audit logs, runbooks
    - Support (10 cases): ticket creation, assignment, canned responses, Zendesk sync
  - Test environment setup requirements
  - Pass criteria: all test cases pass, zero critical bugs
  - Data/Services: Test accounts, sample data
  - Validation: QA team executes all test cases

---

### 13. Performance & Optimization
**User Impact**: Admin dashboards load fast even with large datasets, analytics queries complete quickly.

**Sub-tasks**:
- [ ] **13.1 Database Indexing**
  - Review and create indexes for all Phase 8 queries:
    - `reports`: compound index on `(status, createdAt)`, `(assignedTo, status)`
    - `support_tickets`: compound index on `(status, priority, slaDeadline)`, `(userId, createdAt)`
    - `analytics_events`: compound index on `(eventName, timestamp)`, `(userId, timestamp)`
    - `crm_notes`: index on `(userId, createdAt)`
    - `crm_tasks`: compound index on `(assignedTo, status, dueDate)`
  - Data/Services: MongoDB index creation scripts
  - Instrumentation: Track query performance before/after indexing
  - Validation: Explain plan analysis showing index usage, performance benchmarks

- [ ] **13.2 Query Optimization**
  - Optimize aggregation pipelines using $match early, $project to reduce data transfer
  - Implement cursor-based pagination for large result sets
  - Use covered queries where possible (index-only queries)
  - Add query result caching in Redis (TTL based on data freshness requirements)
  - Data/Services: MongoDB aggregation optimization, Redis cache
  - Instrumentation: Track query execution time, cache hit rates
  - Validation: Performance benchmarks showing <500ms for common queries

- [ ] **13.3 API Response Caching**
  - Implement HTTP caching headers (Cache-Control, ETag) for stable data
  - Redis cache for expensive aggregations (overview metrics, funnel data, cohorts)
  - Cache invalidation strategy: TTL-based (5 min for metrics, 1 hour for cohorts) + event-based (clear on data changes)
  - Data/Services: Redis, HTTP middleware
  - Instrumentation: Track cache hit/miss rates, response time improvements
  - Validation: Load test showing cache effectiveness, verify cache invalidation works

- [ ] **13.4 Frontend Optimization**
  - Code splitting for admin modules (lazy load each dashboard)
  - Virtual scrolling for long lists (reports queue, support tickets)
  - Chart rendering optimization (canvas instead of SVG for large datasets)
  - Debounced search inputs (300ms delay)
  - Data/Services: React.lazy, react-window, Recharts optimization
  - Instrumentation: Track component render times, bundle sizes
  - Validation: Lighthouse performance audit >90 score, smooth scrolling with 1000+ items

---

### 14. Monitoring & Observability
**User Impact**: Engineering and ops teams can quickly identify and resolve issues with comprehensive monitoring.

**Sub-tasks**:
- [ ] **14.1 Admin Dashboard Monitoring**
  - Datadog dashboard for Phase 8 metrics:
    - Admin action rates by module (trust, growth, CRM, etc.)
    - API latency percentiles (p50, p95, p99)
    - Queue depths (reports, support tickets, verifications)
    - SLA compliance rates (trust desk, support tickets)
    - Error rates by endpoint
  - Data/Services: Datadog integration, custom metrics
  - Validation: Dashboard created, metrics populating

- [ ] **14.2 Alerting Rules**
  - High-priority alerts:
    - Support ticket SLA breach rate >10%
    - Trust desk queue depth >100 items
    - Admin API error rate >1%
    - Analytics ingestion lag >5 minutes
    - Health check failures for any integration
  - Alert channels: PagerDuty for critical, Slack for warnings
  - Data/Services: Datadog alerts, PagerDuty integration
  - Validation: Test alerts fire correctly, verify routing

- [ ] **14.3 Tracing & Debugging**
  - OpenTelemetry traces for all admin requests showing service call graph
  - Trace IDs returned in API responses for debugging
  - Structured logging with correlation IDs
  - Data/Services: OpenTelemetry, Datadog APM
  - Validation: Verify traces appear in Datadog, test trace ID lookup

- [ ] **14.4 Analytics Quality Monitoring**
  - Event schema validation error tracking
  - Duplicate event detection
  - Unusual event volume alerting (spike or drop >50%)
  - Funnel integrity checks (conversion rates within expected ranges)
  - Data/Services: AnalyticsService validation, Datadog metrics
  - Validation: Test with malformed events, verify alerts fire

---

## Exit Criteria Before Moving To Phase 9
- [ ] All admin dashboard modules (Overview, Trust, Growth, CRM, Events, Revenue, Labs, System, Support) functional and tested.
- [ ] AnalyticsService provides comprehensive event ingestion, metrics API, funnel analysis, and cohort tracking.
- [ ] SupportService operational with ticket management, SLA tracking, and member portal.
- [ ] All automated + manual tests green (60+ QA test cases, unit tests >80% coverage, E2E tests for critical workflows).
- [ ] Performance targets met (<2s dashboard load, <500ms API p95 latency, analytics ingestion >1000 events/s).
- [ ] Documentation complete (admin user guide, API reference, runbooks, rollout plan).
- [ ] Monitoring dashboards configured with alerting for SLA breaches, queue depths, error rates.
- [ ] Staged rollout plan executed: Internal team → Pilot → Full ops team with success metrics validated.
- [ ] `STEDOWN_PHASE_9_TODO.md` bootstrapped with template, ready for integrations & background jobs phase.

---

Stay disciplined: ingest context, plan deeply, execute relentlessly, test thoroughly, and only then report results.
