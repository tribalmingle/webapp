export const BOOST_AUCTION_LOCALES = ['africa_west', 'africa_east', 'diaspora_eu', 'diaspora_na'] as const

export const BOOST_AUCTION_PLACEMENTS = ['spotlight', 'travel', 'event'] as const

export type AuctionLocale = (typeof BOOST_AUCTION_LOCALES)[number]
export type AuctionPlacement = (typeof BOOST_AUCTION_PLACEMENTS)[number]
