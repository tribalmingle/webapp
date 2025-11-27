# TribalMingle Admin Studio User Guide

> Version: Phase 8 Completion • Date: 2025-11-24
> Audience: Operations, Trust & Safety, Support, Growth, Finance, Engineering Liaison

## 1. Access & Navigation
- URL: `/admin`
- Role Required: `admin` (RBAC enforced). Non-admin receives 403.
- Primary Navigation Modules:
  1. Overview
  2. CRM
  3. Support
  4. Trust & Safety
  5. Growth Lab
  6. Events
  7. Billing
  8. Labs
  9. System
  10. Analytics

Keyboard shortcuts (planned – future phase):
- `g o` Overview, `g c` CRM, `g s` Support, `g t` Trust, `g g` Growth, `g e` Events, `g b` Billing, `g l` Labs, `g y` System, `g a` Analytics

---
## 2. Overview Dashboard
Purpose: Real-time platform pulse (adoption, subscriptions, experiments, alerts).

Key Widgets:
- Active Users (24h / 7d trend sparkline)
- Subscription Conversions (trial → paid funnel)
- Experiment Outcomes (flag status + significance)
- Alert Feed (error spikes, SLA breaches, latency warnings)

Workflow:
1. Review red/yellow indicators at start of shift.
2. Click alert → drill into source module (Support, System, Analytics).
3. If experiment shows >95% probability of superiority, flag for rollout.

Escalation Rules:
- Sustained error rate >2% for 5m → create incident ticket.
- Subscription drop >10% week-over-week → notify Growth lead.

---
## 3. CRM Module
Purpose: Member relationship insight & task coordination.

Components:
- Search Bar: email, name, ID, fuzzy match.
- Profile Panel: demographics, subscription status, recent activity.
- Notes Timeline: chronological context (category tags: support, trust, growth, general).
- Tasks Board: statuses (open, in_progress, blocked, done), priorities (low→urgent).

Workflows:
1. Monthly VIP Review: Filter subscription tier = premium, add follow-up tasks.
2. Complaint Follow-through: After Support resolution, add a satisfaction check task (due in 3 days).
3. Escalation Trace: Use notes timeline to compile context before Trust action.

Data Hygiene:
- Avoid PII duplication; reference user ID only.
- Tag tasks with clear objective verbs ("Call", "Verify", "Confirm").

---
## 4. Support Desk
Purpose: Ticket lifecycle & SLA compliance.

Ticket Fields:
- Priority (low, medium, high, urgent) → SLA matrix (First Response / Resolution).
  - Urgent: 1h / 4h
  - High: 2h / 8h
  - Medium: 4h / 24h
  - Low: 8h / 72h
- Status: open, pending_user, in_progress, resolved, closed
- Category: account, billing, technical, trust, other

Workflow: Resolution
1. Intake: auto-prioritized; assign to self.
2. First Response: personalized greeting + summary.
3. Add canned response (standard solutions) when applicable.
4. Request info → status `pending_user`.
5. Solution applied → mark `resolved`.
6. After 48h with no reply → auto `closed`.

Breach Handling:
- SLA countdown badges turn red; escalate to lead using "Escalate" action.

---
## 5. Trust & Safety
Purpose: Moderation, verification, user risk management.

Subpanels:
- Reports Queue: filters by status (open, in_progress, resolved), priority (urgent at top).
- Verification Queue: photo checks (pending, flagged, approved, rejected).
- User History: combined timeline (reports + actions + verifications).

Moderation Actions:
- approve_content
- reject_content
- warn_user (must include reason template)
- ban_user (duration: 7d / 30d / permanent)

Workflow: Handling Abuse Report
1. Open report → inspect evidence URLs.
2. Check user history for prior warnings.
3. Apply action (ban or warn) → auto-write audit log.
4. Add note in CRM if significant.

Escalation:
- More than 3 high-severity reports in 24h → flag to security channel.
- Permanent ban requires second reviewer sign-off.

---
## 6. Growth Lab
Purpose: Segmentation + Lifecycle Campaigns.

Segments:
- Rule builder: field/operator/value (AND logic currently). Examples:
  - `lastActiveDays > 30` → re-engage
  - `subscriptionStatus = trial AND signupDays < 14` → trial nurture

Campaigns:
- Trigger Types: event, date, segment-inclusion
- Actions: email, push, sms (email primary Phase 8)
- Schedule: immediate / specific date / recurring (CRON planned Phase 9)

Workflow: Create Nurture Campaign
1. Build segment: trial users day 7–13.
2. Create campaign → trigger = segment-inclusion.
3. Action = email template "trial_nurture_v2".
4. Schedule immediate.
5. Monitor metrics (sent, opened, clicked, converted).

Experiments:
- Variant performance table shows conversions & Bayesian probability.
- Rollout when treatment >95% probability & positive lift.

---
## 7. Events Admin
Purpose: Event lifecycle + attendance.

Features:
- Calendar View (month/week/day switch)
- Creation Form (virtual/in-person, capacity, ticketing)
- Registration List (status, payment state)
- QR Check-In (scan → timestamp stored)

Workflow: Live Event Management
1. Pre-event: verify capacity vs registrations.
2. At door: scan QR codes (retry on failure, manual override allowed).
3. Post-event: export feedback; follow-up tasks to CRM for key attendees.

---
## 8. Billing Dashboard
Purpose: Revenue analytics & insight.

Charts:
- MRR Trend
- Active Subscriptions Count
- LTV Cohorts (6/12/24 month projections)
- Refund Distribution (fraud, dissatisfaction, technical, other)
- ARPU Trend (rolling 12 months)

Workflow: Monthly Finance Review
1. Compare cohort LTV vs previous quarter.
2. Analyze refund spike reasons.
3. Flag anomalies >15% deviation to Finance lead.

---
## 9. Labs (Feature Flags & Experiments)
Purpose: Controlled rollouts + experimentation.

Flags:
- Fields: key, name, description, enabled, rolloutPercentage, variants, targetSegments.
- Toggle → confirmation modal (warns about user impact).

Experiments:
- Bayesian metrics: probability superiority, credible intervals.
- Decision: Ship when probability >95% & meets guardrail (no negative retention impact).

Rollback Procedure:
1. Toggle flag off.
2. Verify dependent UI components fallback.
3. Create audit log entry (auto-recorded).

---
## 10. System Configuration
Purpose: Operational health & change tracking.

Health Checks (cached 60s): MongoDB, Redis, Stripe, S3, Twilio, LaunchDarkly.
Environment Variables: masked (suffix `***`).
Audit Logs: filter by action/user/date.
Runbooks: searchable library.

Escalation: Any service status = down for >2m → incident channel ping + runbook follow.

---
## 11. Analytics Module
Purpose: Ad-hoc metrics, funnels, cohorts, ingestion.

Capabilities:
- Metrics Query: aggregation (count/sum/avg/unique), filters, groupBy (date/eventType/property).
- Funnel Analysis: multi-step conversion with dropoff.
- Cohort Tracking: retention/revenue curves.
- Batch Ingestion: buffers 100 events or 10s.

Workflow: Funnel Evaluation
1. Define ordered steps (signup → profile_created → subscription_upgraded).
2. Set date range.
3. Review conversion & largest dropoff.
4. Create Growth task if dropoff >40% at any step.

---
## 12. Global Practices
Logging:
- Each admin action → audit entry (actor, action, targetId, timestamp).

PII/Data Handling:
- Never paste raw user secrets into notes.
- Use export functions for formal reporting, not screenshots.

Security:
- Auto session timeout (Phase 9).
- 2FA enforcement planned.

---
## 13. Rollout & Training (Summary)
Phase 1: Internal Ops (1 week)
Phase 2: Pilot (select regional teams, 2 weeks)
Phase 3: Full adoption (post-acceptance metrics)
Rollback: Disable high-risk modules (feature flag keys: `admin_growth_lab`, `admin_labs_dashboard`).

---
## 14. Troubleshooting Quick Reference
| Symptom | Likely Cause | Action |
|--------|--------------|--------|
| Health check stale | Cache not refreshed | Force refresh (Clear cache button) |
| Segment count zero | Filter mismatch | Re-evaluate rules; check field names |
| Funnel shows 0 second step | Event naming inconsistency | Cross-check event ingestion mapping |
| Flag toggle no effect | Client cache | Hard refresh / invalidate CDN |
| SLA breach not flagged | Clock skew / missed update | Re-run SLA job / verify server time |

---
## 15. Pending / Future Enhancements
- Real-time WebSocket updates (replace polling)
- Role granularity (support-only, trust-only, growth-only)
- Drag-and-drop campaign visual builder
- Automated anomaly alerts (ML-based)

---
## 16. Appendix
Glossary:
- SLA: Service Level Agreement time thresholds.
- LTV: Lifetime Value.
- ARPU: Average Revenue Per User.
- Bayesian Probability: Statistical method for A/B evaluation.

Contact Matrix:
- Support Lead: @support-lead
- Trust Lead: @trust-lead
- Growth Lead: @growth-lead
- Infra On-call: @infra-oncall
- Data Analyst: @data-analyst

---
End of User Guide.
