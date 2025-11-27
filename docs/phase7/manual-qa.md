# Phase 7: Monetization - Manual QA Checklist

## Test Environment Setup
- [ ] Stripe test mode API keys configured
- [ ] Stripe webhook endpoint accessible (use Stripe CLI for local testing)
- [ ] MongoDB test database with clean collections
- [ ] Feature flags set to 100% for test user accounts
- [ ] Redis cache available for rate limiting

---

## 1. Subscription Lifecycle (15 Test Cases)

### Trial Management
- [ ] **SUB-001**: Start 7-day trial for concierge plan - verify `status: 'trialing'` and `trialEndsAt` is 7 days from now
- [ ] **SUB-002**: Start 14-day custom trial - verify `trialEndsAt` reflects custom duration
- [ ] **SUB-003**: Attempt to start second trial for same user - verify existing trial returned (no duplicate)
- [ ] **SUB-004**: Convert trial to paid subscription - verify `status: 'active'`, `trialEndsAt: undefined`, `renewsAt` set

### Plan Upgrades
- [ ] **SUB-005**: Upgrade from concierge to guardian - verify `proratedFromPlan: 'concierge'` and `prorationCreditCents > 0`
- [ ] **SUB-006**: Upgrade from guardian to premium_plus - verify proration credit calculated based on remaining days
- [ ] **SUB-007**: Upgrade immediately after activation - verify proration credit reflects ~30 days remaining

### Plan Downgrades
- [ ] **SUB-008**: Downgrade from premium_plus to free - verify `plan: 'free'`, `status: 'active'`, `renewsAt: undefined`
- [ ] **SUB-009**: Downgrade from guardian to concierge - verify `proratedFromPlan` references higher tier plan

### Cancellation
- [ ] **SUB-010**: Cancel active subscription - verify `status: 'canceled'`, `renewsAt: undefined`
- [ ] **SUB-011**: Attempt to cancel non-existent subscription - verify returns `null` without error

### Past Due Handling
- [ ] **SUB-012**: Mark subscription as past_due - verify `status: 'past_due'`, `pastDueSince` timestamp set
- [ ] **SUB-013**: Transition past_due to canceled - verify status changes correctly

### Stripe Integration
- [ ] **SUB-014**: Verify Stripe customer created with correct metadata (`userId`)
- [ ] **SUB-015**: Verify Stripe subscription created with correct price ID and metadata

---

## 2. Wallet Operations (12 Test Cases)

### Balance Management
- [ ] **WAL-001**: Credit 100 coins to new user - verify balance increases to 100
- [ ] **WAL-002**: Credit 50 coins to user with existing 100 - verify balance is 150
- [ ] **WAL-003**: Debit 75 coins from user with 150 balance - verify balance is 75
- [ ] **WAL-004**: Attempt to debit 200 coins from user with 75 balance - verify throws "Insufficient balance" error

### Input Validation
- [ ] **WAL-005**: Attempt to credit negative amount - verify throws "Credit amount must be positive"
- [ ] **WAL-006**: Attempt to debit negative amount - verify throws "Debit amount must be positive"
- [ ] **WAL-007**: Attempt to credit zero amount - verify throws error
- [ ] **WAL-008**: Attempt to debit zero amount - verify throws error

### Transaction History
- [ ] **WAL-009**: Perform 3 credits and 2 debits - verify `listTransactions` returns all 5 transactions in descending order
- [ ] **WAL-010**: Verify transaction records include `id`, `type`, `amount`, `reference`, `createdAt`

### Idempotency
- [ ] **WAL-011**: Credit 100 coins with idempotency key, then repeat with same key - verify balance increases only once
- [ ] **WAL-012**: Debit 50 coins with idempotency key, then repeat with same key - verify balance decreases only once

---

## 3. Referral Tracking (10 Test Cases)

### Code Generation
- [ ] **REF-001**: Generate referral code - verify 10-character hex format
- [ ] **REF-002**: Generate second code for same user - verify different code created
- [ ] **REF-003**: Generate 3 codes within 24h, attempt 4th - verify throws "REFERRAL_CODE_RATE_LIMIT"

### Event Recording
- [ ] **REF-004**: Record "clicked" event with IP metadata - verify event created with correct type
- [ ] **REF-005**: Record "signed_up" event - verify event persisted
- [ ] **REF-006**: Record "verified" event - verify event persisted
- [ ] **REF-007**: Record "reward_credited" event - verify event persisted

### Abuse Prevention
- [ ] **REF-008**: Record 10 events from same IP for one code - verify 11th throws "REFERRAL_EVENT_RATE_LIMIT"
- [ ] **REF-009**: Record 12 events with same fingerprint for one code - verify 13th throws "REFERRAL_EVENT_FP_RATE_LIMIT"

### Reward Logic
- [ ] **REF-010**: Record signed_up + verified events - call `maybeCreditReward` - verify reward_credited event created and returns `true`. Second call returns `false`.

---

## 4. Stripe Webhook Processing (8 Test Cases)

### Signature Verification
- [ ] **WH-001**: Send webhook with valid Stripe signature - verify processed successfully
- [ ] **WH-002**: Send webhook with invalid signature - verify returns 400 error
- [ ] **WH-003**: Send webhook with missing signature header - verify returns 400 error

### Event Processing
- [ ] **WH-004**: Process `invoice.payment_succeeded` event - verify subscription status updated to active
- [ ] **WH-005**: Process `customer.subscription.updated` event - verify subscription plan/status reflects changes
- [ ] **WH-006**: Process `customer.subscription.deleted` event - verify subscription status set to canceled
- [ ] **WH-007**: Process `invoice.payment_failed` event - verify subscription marked past_due

### Error Handling
- [ ] **WH-008**: Send malformed JSON payload - verify returns 400 error without crashing

---

## 5. Admin Billing Dashboard (5 Test Cases)

### Data Accuracy
- [ ] **ADMIN-001**: Create 2 concierge and 1 guardian active subscriptions - verify dashboard shows correct counts
- [ ] **ADMIN-002**: Verify MRR calculation: (2 * $10) + (1 * $20) = $40.00
- [ ] **ADMIN-003**: Start 5 trials, convert 3 to paid - verify trial conversion rate shows 60%

### Chart Rendering
- [ ] **ADMIN-004**: Verify MRR trend line chart displays last 6 months of data
- [ ] **ADMIN-005**: Verify plan distribution pie chart shows 4 segments (free, concierge, guardian, premium_plus)

---

## 6. Feature Flag Gating (5 Test Cases)

### Subscription Feature
- [ ] **FF-001**: Set `subscription-v1: false` - verify subscription page shows beta access message
- [ ] **FF-002**: Set `subscription-v1: true` - verify subscription page displays plans and pricing

### Wallet Feature
- [ ] **FF-003**: Set `wallet-v1: false` - verify wallet page shows beta access message
- [ ] **FF-004**: Set `wallet-v1: true` - verify wallet page displays balance and transactions

### Referral Feature
- [ ] **FF-005**: Set `referrals-v1: false` - verify referrals page shows beta access message

---

## 7. Analytics Integration (5 Test Cases)

### Referral Funnel
- [ ] **ANA-001**: Record 100 clicks, 40 signups, 20 verified, 10 rewards - verify GraphQL `referralFunnel` query returns correct counts
- [ ] **ANA-002**: Verify conversion rates calculated correctly (40%, 20%, 10% relative to clicks)
- [ ] **ANA-003**: Verify Insights page displays referral funnel table with 4 steps

### Dashboard Display
- [ ] **ANA-004**: Verify Insights page fetches and displays referral funnel data
- [ ] **ANA-005**: Verify empty referral data displays "No referral data available yet" message

---

## Test Summary
- **Total Test Cases**: 60
- **Subscriptions**: 15
- **Wallet**: 12
- **Referrals**: 10
- **Stripe Webhooks**: 8
- **Admin Dashboard**: 5
- **Feature Flags**: 5
- **Analytics**: 5

## Testing Tools
- **Stripe CLI**: For webhook testing (`stripe listen --forward-to localhost:3000/api/webhooks/stripe`)
- **Postman/cURL**: For API endpoint testing
- **MongoDB Compass**: For database inspection
- **Browser DevTools**: For frontend feature flag testing
- **LaunchDarkly Dashboard**: For feature flag management

## Pass Criteria
- All 60 test cases must pass
- Zero critical bugs
- All error messages user-friendly
- All security validations functioning (signature verification, rate limiting, idempotency)
