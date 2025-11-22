# CMS-Driven Marketing Sections – Implementation Notes

## What Shipped
- Added `fetchMarketingBlogPosts` and `fetchMarketingEvents` to `lib/contentful.ts` with the same ISR window (300s) as the rest of the landing page. Both helpers normalize Contentful fields and automatically fall back to curated datasets in `lib/marketing/cms-fallbacks.ts` when the API is unavailable or returns empty collections.
- Created new client components `BlogHighlightsSection` and `EventsSpotlightSection` under `components/marketing/`. Each section accepts localized copy plus CMS data and renders responsive cards with imagery, metadata, and CTAs tailored to `/blog/[slug]` or external RSVP URLs.
- Wired the homepage (`app/[locale]/page.tsx`) to fetch testimonials, blog posts, and events in parallel. The new sections slot between the features deck and testimonials grid so Phase 1 task 1.1.4 now appears end-to-end for every supported locale.
- Localized copy for the new modules lives under `dictionary.cmsSections` for `en`, `fr`, `pt`, and `ar`, keeping marketing messaging in sync with the rest of the page.

## Fallback + Data Integrity
- `lib/marketing/cms-fallbacks.ts` hosts editorial snippets and event metadata tagged with the locales they support. The fetchers slice this data so that each market always renders at least one entry even if Contentful is unreachable.
- CMS results are filtered to ensure every blog post has a slug/title/excerpt and every event has a title plus city; otherwise we drop the entry before rendering.

## Analytics & Instrumentation
- Client sections emit `marketing_blog_click` and `marketing_event_rsvp` via `trackClientEvent`. The `/api/analytics/track` endpoint now whitelists both events so Segment only receives sanctioned payloads containing `{ locale, postId/eventId, position, isVirtual }`.

## Testing Coverage
- Added `tests/lib/contentful-cms.test.ts` to assert fallback behavior for both fetchers when Contentful credentials are absent.
- Added React Testing Library suites for the new components to verify rendering and analytics clicks.
- Existing Vitest suite continues to run through `pnpm test`, ensuring regressions in earlier hero/tribe map work are caught alongside the new CMS surface area.

## Next Steps
- Integration tests against mock Contentful responses are straightforward if/when we add additional locales or content types.
- Placeholder `/blog/[slug]` route still needs implementation before launch; until then CTA links act as landing-page affordances only.
