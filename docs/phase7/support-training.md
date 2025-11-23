# Support & Steward Training (Phase 7 Monetization)

## Goals
Equip support stewards to resolve payment, subscription, wallet, gift, and referral issues quickly and safely.

## Core Concepts
- Wallet Balance: Derived from sum of ledger transactions; single source of truth.
- Subscriptions: Stripe is authority for billing status; internal record mirrors via webhooks.
- Gifts: One-way coin spend; no refunds (manual coin credit possible for exceptions).
- Referrals: Code ownership + event trail; rewards triggered on valid signup activation.

## Common Issues & Resolutions
| Issue | Detection | Resolution |
|-------|-----------|-----------|
| Missing coin credit after purchase | PaymentIntent shows succeeded, wallet unchanged | Trigger manual entitlement (admin script) after verifying metadata coins + no prior credit. |
| Duplicate wallet debit | Two transactions same idempotencyKey | Refund coins via credit transaction with reason `adjustment:duplicate`. |
| Subscription not upgraded | Stripe dashboard shows active subscription; internal status stale | Re-run webhook simulation (admin tool) for subscription ID; if still stale, update record manually. |
| Gift not delivered | Sender sees debit, recipient reports nothing | Verify `gift_sends` record; if absent, re-run sendGift with same idempotencyKey, otherwise credit coins back. |
| Referral not counted | User claims signup via code; progress static | Check `referral_events`; if missing signup event, create manual event with provenance `support-manual`. |

## Escalation Criteria
- Any ledger mismatch across > 3 users in 24h.
- Stripe webhook delivery failure rate > 5% for 30 min.
- Sudden spike in referral signups from identical IP/device fingerprint.

## Tooling & Scripts (Planned)
- `admin/replay-stripe-webhook.ts` – replay events for a subscription/payment intent.
- `admin/ledger-reconcile.ts` – recompute balances and flag discrepancies.
- `admin/referral-audit.ts` – highlight suspicious clusters.

## Data Lookup Cheatsheet
- Wallet balance: `wallets` (field `balance`) + verify with sum(`wallet_transactions.amount`).
- Subscription: `subscriptions` record + Stripe dashboard subscription ID.
- Payment intent: `payment_intents` by provider + metadata.
- Gift: `gift_sends` filtered by senderUserId or recipientUserId.
- Referral: `referral_codes` for code owner + `referral_events` for lifecycle.

## Refund / Credit Policy
- Subscription refunds handled in Stripe; reflect internally via webhook (do not manual edit first).
- Coin adjustments only via ledger transaction (never overwrite balance field).

## Security Practices
- Never ask user for full card details (refer to provider portal).
- Validate idempotencyKey before manual replay operations.
- Log all manual adjustments with reason + steward ID.

## FAQ
Q: Can coins be converted back to cash?  
A: No, coins are a virtual utility token only.

Q: How to handle partial subscription period credit?  
A: Use proration once implemented; interim solution is manual trial extension.

Q: User wants to change referral code after issuing?  
A: Not supported; issue new code and mark old as deprecated (future feature).

