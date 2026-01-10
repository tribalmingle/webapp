# Stripe Global Payment - Quick Reference

## ✅ Configuration Complete!

Your Stripe test keys are now configured and ready to use.

### What's Enabled

#### 🌍 Global Coverage
- ✅ **Americas**: USA, Canada, Mexico, Brazil
- ✅ **Europe**: UK, Germany, France, Spain, Italy, Netherlands + 30 more
- ✅ **Africa**: South Africa, Kenya, Ghana, Egypt (international cards only)
- ⚠️ **Nigeria**: Use Paystack (Stripe doesn't support Nigeria directly)
- ✅ **Asia-Pacific**: Australia, Singapore, Japan, India, New Zealand

#### 💳 Payment Methods
- ✅ **Credit/Debit Cards**: Visa, Mastercard, Amex, Discover
- ✅ **Apple Pay**: Enabled (needs domain verification for production)
- ✅ **Google Pay**: Enabled (needs merchant ID for production)
- ✅ **Regional Methods**: Automatically enabled
  - Europe: SEPA, iDEAL, Giropay, Bancontact
  - UK: Bacs Direct Debit
  - USA: ACH
  - Canada: Interac

## 🚀 Testing Your Setup

### 1. Start Development Server
```bash
npm run dev
# or
pnpm dev
```

### 2. Test Payment Intent Creation
```bash
# Using PowerShell
$body = @{
    amountCents = 1000
    currency = "USD"
    purpose = "subscription"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:3000/api/payments/stripe/intent" `
    -Method Post `
    -Body $body `
    -ContentType "application/json" `
    -Headers @{Authorization="Bearer your_test_jwt"}

$response
```

### 3. Test Different Currencies
```bash
# EUR (Europe)
$body = @{ amountCents = 1000; currency = "EUR"; purpose = "coins" } | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:3000/api/payments/stripe/intent" -Method Post -Body $body -ContentType "application/json"

# GBP (UK)
$body = @{ amountCents = 1000; currency = "GBP"; purpose = "coins" } | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:3000/api/payments/stripe/intent" -Method Post -Body $body -ContentType "application/json"

# ZAR (South Africa)
$body = @{ amountCents = 1000; currency = "ZAR"; purpose = "coins" } | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:3000/api/payments/stripe/intent" -Method Post -Body $body -ContentType "application/json"
```

### 4. Test Cards (Stripe Test Mode)
```
Success:           4242 4242 4242 4242
Decline:           4000 0000 0000 0002
3D Secure:         4000 0025 0000 3155
Insufficient:      4000 0000 0000 9995

Expiry: Any future date (e.g., 12/25)
CVC: Any 3 digits (e.g., 123)
ZIP: Any valid format
```

## 📋 Next Steps

### Immediate (No Action Needed)
- ✅ Stripe test keys configured
- ✅ Multi-currency support enabled
- ✅ Automatic payment methods enabled
- ✅ Apple Pay & Google Pay ready (test mode)

### Before Production Launch

#### 1. Configure Webhooks (Critical!)
```bash
# Install Stripe CLI
scoop install stripe

# Login
stripe login

# Forward webhooks locally for testing
stripe listen --forward-to localhost:3000/api/payments/webhooks/stripe

# Test webhook
stripe trigger payment_intent.succeeded
```

**Production Webhook Setup:**
1. Deploy your app to production
2. Go to: https://dashboard.stripe.com/webhooks
3. Add endpoint: `https://yourdomain.com/api/payments/webhooks/stripe`
4. Select these events:
   - ✅ payment_intent.succeeded
   - ✅ payment_intent.payment_failed
   - ✅ customer.subscription.created
   - ✅ customer.subscription.updated
   - ✅ customer.subscription.deleted
   - ✅ invoice.payment_failed
5. Copy webhook signing secret
6. Add to production env: `STRIPE_WEBHOOK_SECRET=whsec_...`

#### 2. Apple Pay Setup
1. Get Apple Developer Account
2. Create Merchant ID: `merchant.com.tribalmingle`
3. Verify domain in Stripe Dashboard
4. Update `.env.local`: `APPLE_PAY_MERCHANT_ID=merchant.com.tribalmingle`

#### 3. Google Pay Setup
1. Register at: https://pay.google.com/business/console
2. Get Merchant ID
3. Get Stripe Merchant ID from: Dashboard → Settings → Account Details
4. Update environment:
   ```env
   GOOGLE_PAY_MERCHANT_ID=your_google_merchant_id
   STRIPE_MERCHANT_ID=acct_your_stripe_account_id
   ```

#### 4. Paystack for Nigeria
If you want to support Nigerian customers directly:
1. Sign up: https://paystack.com
2. Get API keys
3. Update `.env.local`:
   ```env
   PAYSTACK_SECRET_KEY=sk_live_...
   PAYSTACK_PUBLIC_KEY=pk_live_...
   ```

#### 5. Go Live with Stripe
1. Complete business verification in Stripe Dashboard
2. Add bank account for payouts
3. Get live API keys:
   - Dashboard → Developers → API Keys
   - Toggle "View test data" OFF
   - Copy live keys
4. Update production environment:
   ```env
   STRIPE_SECRET_KEY=sk_live_...
   STRIPE_PUBLISHABLE_KEY=pk_live_...
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
   ```

## 🔍 Verification

### Check Configuration
```bash
# Verify environment variables are loaded
npm run dev

# In browser console:
console.log('Stripe Key:', process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
```

### Verify Payment Flow
1. Navigate to payment page
2. Enter test card: `4242 4242 4242 4242`
3. Check payment intent created
4. Verify in Stripe Dashboard: https://dashboard.stripe.com/test/payments

### Check Multi-Currency
Test with different currency codes: USD, EUR, GBP, CAD, AUD, ZAR, KES, GHS

### Test Apple Pay (Safari only)
- Requires HTTPS (use ngrok or Vercel preview)
- Requires verified domain
- Test on actual Apple device

### Test Google Pay (Chrome/Android)
- Works in Chrome browser
- Test mode enabled automatically
- Production requires approval

## 🛠️ Troubleshooting

### Issue: "No such API key"
- Check `.env.local` file exists
- Verify keys are correct (no spaces)
- Restart dev server

### Issue: "Invalid currency"
- Use 3-letter ISO codes (USD, EUR, GBP)
- All lowercase in API calls
- Check Stripe supports currency for your account

### Issue: "Webhooks not working"
- Use Stripe CLI for local testing
- Verify webhook secret is correct
- Check endpoint is publicly accessible (production)

### Issue: "Apple Pay not showing"
- Requires HTTPS
- Domain must be verified in Stripe
- Only works in Safari/iOS
- Check Apple Pay is enabled in Stripe Dashboard

### Issue: "Google Pay not showing"
- Check merchant ID is configured
- Verify gateway settings
- Test in Chrome browser
- Check Google Pay API enabled

## 📞 Support

### Stripe Resources
- Dashboard: https://dashboard.stripe.com
- Documentation: https://stripe.com/docs
- API Reference: https://stripe.com/docs/api
- Support: https://support.stripe.com
- Status: https://status.stripe.com

### Your Implementation
- Payment Intent: `/app/api/payments/stripe/intent/route.ts`
- Webhook Handler: `/app/api/payments/webhooks/stripe/route.ts`
- Google Pay: `/app/api/payments/google-pay/config/route.ts`
- Apple Pay: `/app/api/payments/apple-pay/session/route.ts`

### Quick Links
- Test Cards: https://stripe.com/docs/testing
- Webhooks: https://dashboard.stripe.com/webhooks
- Apple Pay: https://stripe.com/docs/apple-pay
- Google Pay: https://stripe.com/docs/google-pay

## 🎯 Current Status

✅ **Ready for Development**
- Stripe test keys configured
- Multi-region support enabled
- Multiple currencies supported
- Apple Pay & Google Pay configured
- Automatic payment methods enabled

⚠️ **Needs Action for Production**
- [ ] Configure webhook endpoint + secret
- [ ] Verify Apple Pay domain
- [ ] Register Google Pay merchant
- [ ] Get Stripe live keys
- [ ] Add Paystack for Nigeria (optional)
- [ ] Complete Stripe business verification

---

**File**: `STRIPE_QUICK_REFERENCE.md`  
**Last Updated**: Configuration completed with test keys  
**Status**: ✅ Ready for development testing
