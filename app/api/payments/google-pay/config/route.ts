import { NextRequest } from 'next/server'

// Stub Google Pay payment data request configuration route.
// In production: provide gateway merchantId, allowed auth methods, and tokenization parameters.

export async function GET(_req: NextRequest) {
  const config = {
    apiVersion: 2,
    apiVersionMinor: 0,
    allowedPaymentMethods: [
      {
        type: 'CARD',
        parameters: {
          allowedAuthMethods: ['PAN_ONLY', 'CRYPTOGRAM_3DS'],
          allowedCardNetworks: ['VISA', 'MASTERCARD'],
        },
        tokenizationSpecification: {
          type: 'PAYMENT_GATEWAY',
          parameters: {
            gateway: process.env.GOOGLE_PAY_GATEWAY || 'stripe',
            gatewayMerchantId: process.env.GOOGLE_PAY_MERCHANT_ID || 'tribalmingle_test_merchant',
          },
        },
      },
    ],
    merchantInfo: {
      merchantName: 'TribalMingle',
      merchantId: process.env.GOOGLE_PAY_MERCHANT_ID || 'tribalmingle_test_merchant',
    },
    transactionInfo: {
      totalPriceStatus: 'ESTIMATED',
      totalPrice: '0.00', // Front-end will override
      currencyCode: 'USD',
      countryCode: 'US',
    },
  }
  return new Response(JSON.stringify({ config, stub: true }), { status: 200, headers: { 'Content-Type': 'application/json' } })
}
