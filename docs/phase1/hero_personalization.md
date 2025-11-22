# Hero Personalization Service – Technical Design

## Goals
- Deliver localized hero copy tailored by geo, referral, feature flags, and CMS.
- Support experimentation via LaunchDarkly and analytics instrumentation (Segment/LaunchDarkly context attributes).
- Provide deterministic fallback when personalization fails.

## Architecture
- **Inputs**: locale (from route), geo headers (`x-vercel-ip-country`, `x-vercel-ip-city`), referral code (`?ref=`), marketing campaign param (`?src=`), LaunchDarkly flag variations.
- **Sources**:
  - Contentful hero entries (per locale) with optional variant sets.
  - Static dictionary fallback per locale.
  - Referral metadata mini-registry (JSON in repo → future DB).
- **Service Flow**:
  1. `heroPersonalizationResolver` (server) receives `HeroContext`.
  2. Reads LaunchDarkly flag `marketing-hero-experiment` (variant: `default`, `diaspora`, `referral`, `safety`).
  3. Pulls Contentful hero record + variant blocks, caches for 5 minutes.
  4. Applies rules in order: referral > LaunchDarkly targeted variant > geo > default.
  5. Emits analytics payload describing inputs + variant decision.

## Data Model
```ts
type HeroVariant = {
  key: 'default' | 'diaspora' | 'referral' | 'safety' | 'local';
  title: string;
  highlight: string;
  description: string;
  primaryCta: string;
  secondaryCta: string;
  tagline: string;
};

type HeroDecisionLog = {
  locale: string;
  variantKey: HeroVariant['key'];
  country?: string;
  referralCode?: string;
  featureFlag?: string;
};
```

## API Contract
- `GET /api/marketing/hero?locale=en&ref=abc` → `{ hero: HeroVariant, traceId, source: 'contentful' | 'fallback' }`
- Edge-runtime friendly, caches by `(locale, ref, country)` for 2 minutes.
- Will run server-side only (marketing page fetches server component). CSR fallback only for experiments.

## Frontend Components
- `HeroSection` (Public Web): Renders hero variant + CTA, accepts `HeroVariant` props.
- `HeroBadgeStrip`: Shows meta badge (e.g., “Diaspora spotlight”).
- Analytics hook to send `hero_variant_rendered` event.

## Integrations
- LaunchDarkly server SDK (edge-friendly) via new helper `lib/launchdarkly/server.ts`.
- Segment analytics via server events (to ensure exposures tracked).
- Contentful integration reused via `fetchLandingContent` (adds variant array).

## Testing Plan
1. Unit tests for `resolveHeroVariant` covering referral > flag > geo > default ordering.
2. Integration test for `/api/marketing/hero` verifying caching + fallback.
3. Snapshot test for `HeroSection` given variant props.

## Verification Criteria
- Returns hero variant in <50ms (server) with caching.
- Analytics event fired with variant decision + context.
- LaunchDarkly off → default/fallback hero matches dictionary values.
- Works for all locales, respects RTL.

## Implementation Status (Nov 20, 2025)
- `app/[locale]/page.tsx` consumes the personalization API via `getHeroVariant` and renders the new `HeroSection` component.
- Segment + LaunchDarkly hooks fire inside `lib/marketing/hero.ts` with structured context metadata.
- Tests implemented:
  - `tests/lib/hero.test.ts` for referral > experiment > geo > default ordering.
  - `tests/api/hero-route.test.ts` for `/api/marketing/hero` contract.
  - `tests/components/hero-section.test.tsx` (includes JSX snapshot) for UI rendering.