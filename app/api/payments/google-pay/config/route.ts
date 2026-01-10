import { NextRequest, NextResponse } from 'next/server'

// Google Pay configuration for Stripe gateway integration
// Supports multiple regions: Americas, Europe, Africa, Asia-Pacific
// Reference: https://developers.google.com/pay/api/web/reference/request-objects

export async function GET(req: NextRequest) {
  // Extract region/currency from query params for dynamic configuration
  const searchParams = req.nextUrl.searchParams
  const region = searchParams.get('region') || 'global'
  const currency = searchParams.get('currency') || 'USD'
  const countryCode = searchParams.get('countryCode') || 'US'

  const config = {
    apiVersion: 2,
    apiVersionMinor: 0,
    allowedPaymentMethods: [
      {
        type: 'CARD',
        parameters: {
          // Authentication methods supported
          allowedAuthMethods: ['PAN_ONLY', 'CRYPTOGRAM_3DS'],
          // Supported card networks - globally accepted
          allowedCardNetworks: [
            'VISA', 
            'MASTERCARD', 
            'AMEX',
            'DISCOVER',
            'INTERAC',  // Canada
            'JCB',      // Japan/Asia
          ],
          // Require billing address for fraud prevention
          billingAddressRequired: true,
          billingAddressParameters: {
            format: 'FULL',
            phoneNumberRequired: false
          }
        },
        tokenizationSpecification: {
          type: 'PAYMENT_GATEWAY',
          parameters: {
            // Stripe processes the payment
            gateway: process.env.GOOGLE_PAY_GATEWAY || 'stripe',
            // Your Stripe merchant/account ID (starts with acct_)
            gatewayMerchantId: process.env.GOOGLE_PAY_MERCHANT_ID || process.env.STRIPE_MERCHANT_ID || 'tribalmingle_test_merchant',
          },
        },
      },
    ],
    merchantInfo: {
      merchantName: process.env.GOOGLE_PAY_MERCHANT_NAME || 'TribalMingle',
      merchantId: process.env.GOOGLE_PAY_MERCHANT_ID || undefined, // Google Pay merchant ID (optional for test)
    },
    transactionInfo: {
      totalPriceStatus: 'ESTIMATED',
      totalPrice: '0.00', // Frontend will override with actual amount
      currencyCode: currency.toUpperCase(),
      countryCode: countryCode.toUpperCase(),
    },
    // Email required for receipt and customer record
    emailRequired: true,
    // Shipping not needed for digital goods
    shippingAddressRequired: false,
  }

  const isConfigured = !!(process.env.GOOGLE_PAY_MERCHANT_ID || process.env.STRIPE_MERCHANT_ID)
  
  return NextResponse.json({ 
    config, 
    stub: !isConfigured,
    environment: process.env.GOOGLE_PAY_ENVIRONMENT || 'TEST',
    supportedRegions: ['US', 'CA', 'GB', 'EU', 'ZA', 'KE', 'GH', 'AU', 'SG'],
    supportedCurrencies: ['USD', 'EUR', 'GBP', 'CAD', 'ZAR', 'KES', 'GHS', 'AUD', 'SGD', 'NGN']
  })
}
