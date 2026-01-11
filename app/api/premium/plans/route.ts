import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/premium/plans
 * Fetch available subscription plans
 */
export async function GET(request: NextRequest) {
  try {
    const plans = [
      {
        id: 'basic',
        name: 'Basic',
        price: 0,
        interval: 'month',
        features: [
          'Browse profiles',
          'Daily likes (5/day)',
          'Standard matches',
          'Basic filters',
          'Chat with matches'
        ],
        limits: {
          dailyLikes: 5,
          superlikes: 0,
          rewinds: 0,
          boosts: 0
        }
      },
      {
        id: 'premium_monthly',
        name: 'Premium',
        price: 19.99,
        interval: 'month',
        currency: 'usd',
        stripeProductId: 'prod_premium_monthly',
        stripePriceId: 'price_premium_monthly',
        features: [
          'Unlimited likes',
          '5 superlikes per day',
          '3 rewinds per day',
          '1 boost per month',
          'See who liked you',
          'Advanced filters',
          'Incognito mode',
          'Read receipts',
          'Priority support'
        ],
        limits: {
          dailyLikes: -1, // unlimited
          superlikes: 5,
          rewinds: 3,
          boosts: 1
        },
        badge: 'Most Popular'
      },
      {
        id: 'premium_annual',
        name: 'Premium Annual',
        price: 149.99,
        interval: 'year',
        currency: 'usd',
        stripeProductId: 'prod_premium_annual',
        stripePriceId: 'price_premium_annual',
        features: [
          'All Premium features',
          'Save 37%',
          'Unlimited likes',
          '10 superlikes per day',
          '5 rewinds per day',
          '2 boosts per month',
          'See who liked you',
          'Advanced filters',
          'Incognito mode',
          'Read receipts',
          'Priority support',
          'Exclusive events access'
        ],
        limits: {
          dailyLikes: -1,
          superlikes: 10,
          rewinds: 5,
          boosts: 2
        },
        badge: 'Best Value',
        savings: 0.37
      },
      {
        id: 'elite',
        name: 'Elite',
        price: 49.99,
        interval: 'month',
        currency: 'usd',
        stripeProductId: 'prod_elite_monthly',
        stripePriceId: 'price_elite_monthly',
        features: [
          'All Premium features',
          'Unlimited superlikes',
          'Unlimited rewinds',
          '5 boosts per month',
          'Profile verification priority',
          'Concierge service access',
          'Guaranteed dates program',
          '24/7 VIP support',
          'Exclusive tribe events',
          'Profile boost on signup'
        ],
        limits: {
          dailyLikes: -1,
          superlikes: -1,
          rewinds: -1,
          boosts: 5
        },
        badge: 'VIP'
      }
    ]

    return NextResponse.json({
      success: true,
      plans
    })

  } catch (error: any) {
    console.error('[premium/plans] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
