# Phase 7 Rollout Plan

## Objectives
Safely introduce monetization (subscriptions, wallet, gifts, boosts) and analytics instrumentation with minimal user friction and controlled exposure.

## Stages
1. Internal Alpha
   - Enable wallet + coin bundles (test mode providers).
   - Limited subscription plan (single tier, trial). 
   - Referral codes disabled.
2. Steward Beta
   - Activate gift sending (low-cost items) to test UX.
   - Referral codes enabled for stewards only.
   - Stripe live mode for subscriptions; coin bundles remain test mode.
3. Public Beta
   - Enable premium gifts + boosts.
   - Coin bundles live mode.
   - Fraud heuristics baseline; daily snapshot job active.
4. Scale-Up
   - Optimization of webhook retries, proration logic.
   - Launch localized gift catalog.
   - Apple / Google Pay production enablement.
5. Optimization & Growth
   - Referral campaign variants A/B.
   - Dynamic pricing for boosts based on demand.

## Safeguards
- Feature flags per component (subscription, wallet, gifts, boosts, referrals).
- Hard daily coin purchase cap until fraud heuristics tuned.
- Webhook monitoring (latency, failure count, retry queue size).

## Success Metrics
- Subscription trial conversion rate > 25%.
- Average gift spend per active user per week growth.
- Referral activation (signups that create at least one session) > 40%.
- Boost repeat purchase (users buying >1 boost in 30d) > 30%.

## Abort / Rollback Criteria
- Webhook failure > 5% over 15 min window.
- Fraud heuristic flags > 3x baseline in a 24h period.
- Wallet balance mismatch incidence > 0.1% of active users.

## Telemetry / Dashboards
- Real-time event counts (gift_send, subscription_created, coin_purchase, referral_signup).
- Daily snapshot composites (see monetization.md).
- Job execution status + duration metrics.

## Comms Plan
- Internal Alpha: Slack updates only.
- Steward Beta: Steward briefing doc + short video.
- Public Beta: In-app changelog card + email for waitlist users.
- Scale-Up: Blog post + social amplification.

## Post-Launch Hardening
- Add retry dead-letter queue for webhooks.
- Implement automated ledger reconciliation script.
- Expand fraud model (device fingerprint, IP clustering).

