# Stripe Global Payment Setup Guide

## Overview
This guide covers setting up Stripe for global payments including Nigeria, Africa, Europe, and America, with Apple Pay and Google Pay support.

## ✅ Current Configuration

### Test Keys Configured
- **Publishable Key**: `pk_test_51SlHYvAC8wqaC5qc...` 
- **Secret Key**: `sk_test_51SlHYvAC8wqaC5qc...`
- **Environment**: Test Mode

## 🌍 Multi-Region Support

### Stripe Global Coverage
Stripe automatically supports **135+ countries** including:
- ✅ **Americas**: USA, Canada, Brazil, Mexico
- ✅ **Europe**: UK, Germany, France, Spain, Italy, Netherlands, etc.
- ✅ **Asia-Pacific**: Australia, Singapore, Japan, India
- ⚠️ **Africa**: Limited direct support

### Africa/Nigeria Considerations
**Important**: Stripe does NOT directly support Nigeria. For Nigerian customers, you have two options:

1. **Use Paystack (Recommended for Nigeria)**
   - Native Nigerian payment provider
   - Supports local cards, bank transfers, USSD
   - Already scaffolded in your app: `/api/payments/paystack/initialize`

2. **Stripe for International African Customers**
   - Works for customers with international cards (Visa, Mastercard)
   - Supported countries: South Africa, Kenya, Ghana, Egypt, Morocco

### Recommended Setup Strategy
```
┌─────────────────────────────────────────┐
│  Customer Location Detection            │
├─────────────────────────────────────────┤
│  Nigeria → Paystack                     │
│  Africa (Int'l cards) → Stripe          │
│  Europe/Americas → Stripe               │
│  All regions → Apple Pay/Google Pay     │
└─────────────────────────────────────────┘
```

## 💳 Payment Methods Support

### Currently Enabled
Your Stripe integration uses `automatic_payment_methods: { enabled: true }` which automatically supports:
- ✅ Credit/Debit Cards (Visa, Mastercard, Amex)
- ✅ Apple Pay (when configured)
- ✅ Google Pay (when configured)
- ✅ Digital Wallets
- ✅ Link (Stripe's one-click checkout)

### Regional Payment Methods
Stripe will automatically show region-specific methods:
- **Europe**: SEPA, Giropay, iDEAL, Bancontact, EPS
- **Americas**: ACH, Interac (Canada)
- **Asia**: Alipay, WeChat Pay
- **UK**: Bacs Direct Debit

## 🍎 Apple Pay Setup

### Prerequisites
1. **Apple Developer Account** (required)
2. **Merchant ID** from Apple
3. **Domain verification**

### Configuration Steps

#### 1. Create Merchant ID in Apple Developer Portal
```
1. Go to: https://developer.apple.com/account
2. Certificates, Identifiers & Profiles → Identifiers
3. Create new Merchant ID: merchant.com.tribalmingle
4. Note the Merchant ID
```

#### 2. Configure in Stripe Dashboard
```
1. Go to: Stripe Dashboard → Settings → Payment Methods
2. Enable Apple Pay
3. Add your domain(s)
4. Download verification file
```

#### 3. Domain Verification
```bash
# The verification file must be accessible at:
https://yourdomain.com/.well-known/apple-developer-merchantid-domain-association

# Already created in your app at:
# /public/.well-known/apple-developer-merchantid-domain-association
```

#### 4. Update Environment Variables
```env
APPLE_PAY_MERCHANT_ID=merchant.com.tribalmingle
APPLE_PAY_MERCHANT_NAME=TribalMingle
```

### Testing Apple Pay
- Works on Safari on Mac/iOS devices
- Requires HTTPS (even in development, use ngrok or Vercel preview)
- Test cards: Use Stripe test card numbers in Wallet

## 🤖 Google Pay Setup

### Prerequisites
1. **Google Pay Business Console** account
2. **Production approval** (for live use)

### Configuration Steps

#### 1. Register with Google Pay
```
1. Go to: https://pay.google.com/business/console
2. Create business profile
3. Get Merchant ID
```

#### 2. Configure Integration Type
Your app uses **GATEWAY** tokenization (Stripe processes payments):
```javascript
{
  type: 'PAYMENT_GATEWAY',
  parameters: {
    gateway: 'stripe',
    gatewayMerchantId: 'your_stripe_merchant_id'
  }
}
```

#### 3. Get Stripe Merchant ID
```
1. Stripe Dashboard → Settings → Account Details
2. Copy your Merchant ID (starts with acct_)
```

#### 4. Update Environment Variables
```env
GOOGLE_PAY_GATEWAY=stripe
GOOGLE_PAY_MERCHANT_ID=acct_your_stripe_merchant_id
GOOGLE_PAY_MERCHANT_NAME=TribalMingle
```

### Testing Google Pay
- Works on Chrome/Android devices
- Test environment: Set `environment: 'TEST'` in config
- Production: Requires Google approval + `environment: 'PRODUCTION'`

## 🔔 Webhook Configuration

### Why Webhooks Matter
Webhooks ensure your database stays in sync with Stripe for:
- Subscription renewals
- Failed payments
- Refunds
- Disputes

### Setup Steps

#### 1. Create Webhook in Stripe Dashboard
```
1. Stripe Dashboard → Developers → Webhooks
2. Add endpoint: https://yourdomain.com/api/payments/webhooks/stripe
3. Select events to listen for (see below)
4. Copy the Webhook Signing Secret (starts with whsec_)
```

#### 2. Required Events
```
✅ payment_intent.succeeded
✅ payment_intent.payment_failed
✅ customer.subscription.created
✅ customer.subscription.updated
✅ customer.subscription.deleted
✅ invoice.payment_failed
✅ invoice.payment_succeeded
✅ charge.refunded
```

#### 3. Update Environment Variable
```env
STRIPE_WEBHOOK_SECRET=whsec_your_signing_secret_here
```

#### 4. Test Webhooks Locally
```bash
# Install Stripe CLI
# Windows (Scoop):
scoop install stripe

# Forward webhooks to local dev server:
stripe login
stripe listen --forward-to localhost:3000/api/payments/webhooks/stripe

# Test specific event:
stripe trigger payment_intent.succeeded
```

## 💰 Currency & Multi-Region Configuration

### Supported Currencies
Stripe supports 135+ currencies. Configure based on customer location:

```typescript
// Auto-detect or let user choose
const currencyByRegion = {
  US: 'USD',
  EU: 'EUR',
  GB: 'GBP',
  NG: 'NGN', // Use Paystack for Nigeria
  ZA: 'ZAR',
  KE: 'KES',
  GH: 'GHS'
}
```

### Dynamic Currency Selection
Your payment intent already supports currency parameter:
```typescript
const pi = await stripe.paymentIntents.create({
  amount: amountCents,
  currency: currency.toLowerCase(), // 'usd', 'eur', 'gbp', etc.
  automatic_payment_methods: { enabled: true }
})
```

## 🚀 Going Live (Production)

### Pre-Launch Checklist

#### 1. Activate Stripe Account
```
☐ Complete business verification
☐ Add bank account for payouts
☐ Set business details
☐ Enable live mode
```

#### 2. Get Live API Keys
```
1. Stripe Dashboard → Developers → API Keys
2. Toggle "View test data" OFF
3. Copy Live keys
4. Update production environment variables
```

#### 3. Security Best Practices
```env
# Production .env (Vercel/server only, never commit)
STRIPE_SECRET_KEY=sk_live_...  # Never expose in frontend
STRIPE_WEBHOOK_SECRET=whsec_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...  # Safe for frontend
```

#### 4. Test in Production
```
☐ Small test payment with real card
☐ Verify webhook delivery
☐ Check database sync
☐ Test refund flow
☐ Verify Apple Pay domain
☐ Test Google Pay flow
```

## 🛡️ Compliance & Security

### PCI Compliance
✅ **Already compliant** - Stripe handles card data
- Never store card numbers
- Stripe Elements/Payment Request API handles tokenization
- Your server only receives payment tokens

### 3D Secure (SCA)
✅ **Automatically enabled** with `automatic_payment_methods`
- Required in Europe (Strong Customer Authentication)
- Stripe handles authentication flows
- Reduces fraud and chargebacks

### Data Residency
- EU customers: Data stored in EU (GDPR compliant)
- US customers: Data stored in US
- Configurable via Stripe Dashboard

## 📊 Regional Configuration Matrix

| Region | Primary Gateway | Fallback | Apple Pay | Google Pay | Local Methods |
|--------|----------------|----------|-----------|------------|---------------|
| **USA** | Stripe | - | ✅ | ✅ | ACH, Link |
| **Europe** | Stripe | - | ✅ | ✅ | SEPA, iDEAL |
| **UK** | Stripe | - | ✅ | ✅ | Bacs |
| **Nigeria** | Paystack | Stripe* | ✅ | ✅ | Bank Transfer, USSD |
| **South Africa** | Stripe | Paystack | ✅ | ✅ | - |
| **Kenya** | Stripe | Paystack | ✅ | ✅ | M-Pesa (via Paystack) |

*Stripe fallback for international cards only

## 🔧 Implementation Status

### ✅ Already Implemented
- Stripe PaymentIntent API integration
- Automatic payment methods
- Webhook event processing
- Apple Pay domain association file
- Google Pay configuration endpoint
- Multi-currency support

### ⚠️ Needs Configuration
- [ ] Webhook secret (after deploying to production)
- [ ] Apple Pay merchant ID verification
- [ ] Google Pay merchant ID
- [ ] Paystack keys (for Nigeria)

### 📝 Code Locations
```
Payment Intent:     /app/api/payments/stripe/intent/route.ts
Webhook Handler:    /app/api/payments/webhooks/stripe/route.ts
Google Pay Config:  /app/api/payments/google-pay/config/route.ts
Apple Pay Session:  /app/api/payments/apple-pay/session/route.ts
Payment Service:    /lib/services/payment-service.ts
```

## 🧪 Testing

### Test Cards
```
Success:           4242 4242 4242 4242
Decline:           4000 0000 0000 0002
3D Secure:         4000 0025 0000 3155
Insufficient Funds: 4000 0000 0000 9995

Any future expiry date, any 3-digit CVC
```

### Test Scenarios
```bash
# 1. Basic payment
curl -X POST http://localhost:3000/api/payments/stripe/intent \
  -H "Content-Type: application/json" \
  -d '{"amountCents": 1000, "currency": "USD", "purpose": "subscription"}'

# 2. Multi-currency
curl -X POST http://localhost:3000/api/payments/stripe/intent \
  -H "Content-Type: application/json" \
  -d '{"amountCents": 1000, "currency": "EUR", "purpose": "coins"}'

# 3. Test webhook
stripe trigger payment_intent.succeeded
```

## 📞 Support Resources

### Stripe Documentation
- [Global Payments](https://stripe.com/global)
- [Apple Pay](https://stripe.com/docs/apple-pay)
- [Google Pay](https://stripe.com/docs/google-pay)
- [Webhooks](https://stripe.com/docs/webhooks)
- [Testing](https://stripe.com/docs/testing)

### Contact
- Stripe Support: https://support.stripe.com
- Dashboard: https://dashboard.stripe.com
- API Status: https://status.stripe.com

## 🎯 Next Steps

1. **Immediate** (Already Done ✅)
   - ✅ Stripe keys configured
   - ✅ Test mode active
   - ✅ Multi-currency support enabled

2. **Before Production Launch**
   - [ ] Configure webhooks (get signing secret)
   - [ ] Set up Apple Pay merchant ID
   - [ ] Register Google Pay merchant
   - [ ] Add Paystack for Nigeria
   - [ ] Test all payment flows

3. **Production Deployment**
   - [ ] Switch to live API keys
   - [ ] Verify webhook endpoint
   - [ ] Complete business verification
   - [ ] Enable Stripe Radar (fraud prevention)
   - [ ] Set up email receipts

## 💡 Pro Tips

1. **Start with test mode** - Thoroughly test before going live
2. **Use automatic_payment_methods** - Gets you latest payment methods automatically
3. **Always verify webhooks** - Prevents duplicate charges and fraud
4. **Enable Radar** - Stripe's ML fraud detection (included free)
5. **Set up email receipts** - Better customer experience
6. **Monitor failed payments** - Set up alerts in Stripe Dashboard
7. **Use metadata** - Track purchases with custom data
8. **Implement idempotency** - Prevent duplicate charges on retries

---

**Status**: ✅ Test keys configured and ready for development
**Next Action**: Deploy to get webhook URL, then complete webhook configuration
