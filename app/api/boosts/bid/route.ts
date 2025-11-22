import { NextResponse } from 'next/server'
import { z } from 'zod'

import { getCurrentUser } from '@/lib/auth'
import { trackServerEvent } from '@/lib/analytics/segment'
import {
  submitBoostBid,
  BOOST_AUCTION_LOCALES,
  BOOST_AUCTION_PLACEMENTS,
  BoostAuctionDisabledError,
  BoostBidConflictError,
  BoostBidTooLowError,
  BoostBidValidationError,
} from '@/lib/boost/bid-service'
import { InsufficientBoostCreditsError } from '@/lib/boost/credit-ledger-service'

const bidPayloadSchema = z.object({
  placement: z.enum(BOOST_AUCTION_PLACEMENTS).default('spotlight'),
  locale: z.enum(BOOST_AUCTION_LOCALES),
  bidAmountCredits: z.number().int().positive().max(500),
  autoRollover: z.boolean().optional(),
})

export async function POST(request: Request) {
  const authUser = await getCurrentUser()

  if (!authUser) {
    return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 })
  }

  const payload = await safeJson(request)
  const validation = bidPayloadSchema.safeParse(payload)

  if (!validation.success) {
    return NextResponse.json({ success: false, errors: validation.error.flatten().fieldErrors }, { status: 400 })
  }

  try {
    const bid = await submitBoostBid({
      userId: authUser.userId,
      ...validation.data,
    })

    await trackServerEvent({
      userId: authUser.userId,
      event: 'boost.bid.submitted',
      properties: {
        sessionId: bid.sessionId.toHexString(),
        placement: validation.data.placement,
        locale: validation.data.locale,
        bidAmountCredits: validation.data.bidAmountCredits,
        autoRollover: validation.data.autoRollover ?? false,
        auctionWindowStart: bid.auctionWindowStart.toISOString(),
      },
    })

    return NextResponse.json({
      success: true,
      bid: {
        sessionId: bid.sessionId.toHexString(),
        status: bid.status,
        auctionWindowStart: bid.auctionWindowStart.toISOString(),
        boostStartsAt: bid.boostStartsAt.toISOString(),
        boostEndsAt: bid.boostEndsAt.toISOString(),
        bidAmountCredits: bid.bidAmountCredits,
        availableCredits: bid.availableCredits,
      },
    })
  } catch (error) {
    if (error instanceof BoostAuctionDisabledError) {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 })
    }

    if (error instanceof BoostBidTooLowError || error instanceof BoostBidValidationError) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 })
    }

    if (error instanceof InsufficientBoostCreditsError) {
      return NextResponse.json({ success: false, error: 'Insufficient boost credits' }, { status: 402 })
    }

    if (error instanceof BoostBidConflictError) {
      return NextResponse.json({ success: false, error: error.message }, { status: 409 })
    }

    console.error('[boosts] bid placement failed', error)
    return NextResponse.json({ success: false, error: 'Unable to submit boost bid' }, { status: 500 })
  }
}

async function safeJson(request: Request) {
  try {
    return await request.json()
  } catch {
    return {}
  }
}
