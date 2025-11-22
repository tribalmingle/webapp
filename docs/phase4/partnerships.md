# B2B Tribe Partnerships Playbook

_Last updated: 2025-11-22_

## Objective
Launch a lightweight program for cultural centers, matchmakers, and diaspora organizations that want to funnel members into Tribal Mingle while sharing anonymized insights + concierge perks.

## Partner Lifecycle
1. **Inbound qualification** – Capture lead via admin UI (trust tab backlog for now). Required data: org name, region, tribe focus, contact, expected member volume, compliance docs.
2. **Due diligence** – Ops reviews safeguarding standards, background checks, revenue split expectations. Store notes in `partner_accounts` collection (to be created once data layer lands).
3. **Activation** – Issue co-branded referral links + guardian portal access. Provide LaunchDarkly flag `partner:<slug>` for tailored onboarding copy.
4. **Ongoing success** – Monthly trust sync, shared KPI dashboards (conversion, verified matches, concierge engagements). Trigger retention experiments when performance dips.

## Data Requirements (MVP)
- `partner_accounts` collection: `_id`, `name`, `contact`, `region`, `tribe`, `status`, `commissionRate`, `notes`, `createdAt`, `updatedAt`.
- `partner_events` log: track referrals, concierge escalations, payouts.

## Revenue Model
- Default referral share: 15% of first 6 months net revenue for paying members introduced by partner.
- Concierge retainers: optional $499/mo service credited against payouts if partner wants dedicated steward.

## Next Steps
1. Add admin UI card for “Partner leads” (Phase 4 iteration 2).
2. Backfill partner analytics in retention experiment suite.
3. Draft legal addendum + SOC2-aligned data handling appendix.
