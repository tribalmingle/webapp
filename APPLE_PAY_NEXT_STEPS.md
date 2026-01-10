# Apple Pay - Next Steps

## ✅ Domain Verified!

Your domain `tribalmingle.com` is already enabled for Apple Pay in Stripe.

## Next Steps

### 1. Get Your Merchant Identifier

In Stripe Dashboard:
1. Go to: **Settings → Payment methods**
2. Find **Apple Pay** section
3. Look for your **Merchant Identifier**
4. It should look like: `merchant.stripe.tribalmingle` or similar

### 2. Update Environment Variable

Add to your `.env.local` file:
```env
APPLE_PAY_MERCHANT_ID=merchant.stripe.tribalmingle
```

(Replace with your actual merchant ID from step 1)

### 3. Test Apple Pay

**Requirements for Testing:**
- Safari browser (Mac or iOS device)
- HTTPS connection (use ngrok or deploy to Vercel)
- Test cards added to Apple Wallet

**Test on Mac:**
1. Deploy to Vercel preview or use ngrok
2. Open in Safari
3. Go to checkout/payment page
4. Apple Pay button should appear
5. Click and complete payment with test card

**Test Cards:**
- Add Stripe test card to Wallet: `4242 4242 4242 4242`
- Any future expiry date
- Any 3-digit CVC

### 4. Verify in Code

Your payment intent already includes Apple Pay support via `automatic_payment_methods: { enabled: true }`

The Stripe SDK will automatically show Apple Pay when:
- ✅ Domain is verified (DONE!)
- ✅ User is on Safari/iOS
- ✅ User has cards in Apple Wallet
- ✅ HTTPS connection

## Production Checklist

- [x] Domain verified in Stripe
- [ ] Get merchant identifier from Stripe
- [ ] Update APPLE_PAY_MERCHANT_ID in environment
- [ ] Test on Safari/iOS device
- [ ] Test with Stripe test cards
- [ ] Deploy to production

## Troubleshooting

**Apple Pay button not showing?**
- Must use HTTPS (not http://localhost)
- Must use Safari browser
- User must have cards in Apple Wallet
- Check merchant ID is correct in environment

**"Merchant validation failed"?**
- Verify domain is enabled in Stripe (✅ Already done!)
- Check APPLE_PAY_MERCHANT_ID matches Stripe
- Ensure proper HTTPS certificate

---

**Status**: Domain verified ✅ → Now get merchant ID and test!
