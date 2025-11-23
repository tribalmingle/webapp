# Phase 7 Monetization Overview

## Components
- Payments: Stripe PaymentIntents, Paystack transactions, Apple/Google Pay stubs.
- Wallet: Mongo-backed balance + transactional ledger with idempotency.
- Subscriptions: Stripe subscription lifecycle + internal plan persistence + webhook sync.
- Gifts: Catalog + wallet debit + persistence of sent gifts.
- Referrals: Code generation, event tracking, progress aggregation (future fraud heuristics).
- Boosts: Time-bound visibility boosts (stub service).
- Analytics: Events + sessions + daily snapshots + realtime stats.

## Payment Flows
1. Coin Bundle Purchase (Stripe) -> PaymentIntent metadata (coins) -> Webhook credits wallet idempotently.
2. Subscription Upgrade -> Stripe customer + subscription creation -> Webhook updates renewsAt/status.
3. Paystack Charge -> verify route updates status + applies entitlements.
4. Gift Sending -> Direct wallet debit (atomic) -> gift record persistence.

## Idempotency Safeguards
- Wallet credit/debit accepts `idempotencyKey` persisted in transactions collection.
- Coin credit checks PaymentIntent metadata and flags via internal payment record.
- Webhook subscription events keyed by stripeSubscriptionId; updates are idempotent.

## Collections
- `payment_intents`: status, provider, amount, coins metadata, entitlementApplied.
- `wallets`, `wallet_transactions`: current balance + ledger with reason + idempotencyKey.
- `subscriptions`: userId, plan, stripeCustomerId, stripeSubscriptionId, status, renewsAt, trial info.
- `referral_codes`, `referral_events`: code issuance + signup/credit events.
- `gift_sends`: giftId, sender/recipient, coinsSpent, createdAt.
- `daily_metrics`: snapshot rollups.
- `analytics_events`, `user_sessions`: journey tracking.

## Entitlements Mapping
- Subscription payment success -> activate/upgrade plan.
- Coin bundle success -> increase wallet balance.
- Future: Boost purchase -> schedule boost session; purchase with coins.

## Webhooks
- Stripe: payment_intent.succeeded, invoice.*, customer.subscription.* used to credit coins and sync subscription.
- Paystack: verify endpoint acts like webhook (API pull).

## Failure Handling
- Invoice payment_failed -> mark subscription status tentative (TODO finalize logic).
- Duplicate coin credit blocked by `entitlementApplied` / metadata flags.

## Background Jobs (Stubs)
- Daily metrics snapshot.
- Trial expiry scan.
- Wallet intent cleanup.
- Referral fraud scan.

## Future Enhancements
- Proration & mid-cycle plan changes.
- Gift localization + dynamic pricing.
- Fraud heuristics & referral rate limiting.
- Production Apple/Google Pay tokenization.
- Advanced analytics funnels + anomaly detection.

## Operational KPIs
- Subscription conversion rate.
- ARPU (avg revenue per user) proxy via coins + subs.
- Referral activation rate.
- Gift spend distribution by category.
- Boost purchase frequency.

## Security & Compliance
- Webhook signature verification (Stripe).
- Idempotent transactional wallet operations.
- Minimal PII in payment records; rely on provider for sensitive data.

## Rollout Strategy (See rollout.md)
- Start with limited subscription plans, then enable coin bundles, then gifts/boosts.

