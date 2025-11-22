# Marketing Site Architecture Plan (Phase 1.1)

## Goals
- Stand up a dedicated Next.js 16 App Router marketing surface optimized for multilingual content, SEO, and personalization.
- Power all hero/testimonials/events/blog sections from Contentful with ISR support and LaunchDarkly-driven experiments.
- Keep marketing bundle isolated from the authenticated app to enable separate deployment cadence while sharing design tokens.

## Proposed Repo Layout
```
/marketing-app
  package.json          # Next.js 16 app router project
  next.config.mjs       # i18n domains, Contentful + LD env wiring
  app/
    (lang)/page.tsx     # locale segments (en, fr, pt, ar)
    layout.tsx          # shared metadata + font/color tokens
    [slug]/page.tsx     # CMS-driven dynamic routes (blog, events)
  contentful/
    client.ts           # SDK + preview helper
    models.ts           # Type definitions for entries
  lib/
    personalization/    # hero rules, referral-based variants
    analytics/segment.ts
    featureFlags/ld.ts
  public/
    apple-developer-domain-association.txt
  styles/
    globals.css
  components/
    primitives/         # shadcn/ui exports
    sections/           # hero, tribe map, testimonial slider, etc.
```

The existing repo remains the member/admin app. We will either:
1. Add `/marketing-app` as a new workspace managed via pnpm workspaces, or
2. Convert the current repo into a monorepo (`package.json` at root + `apps/{marketing,app}`) if we need to share tooling.

Initial step (Step 1.1) will pick option 1 for speed (create `/marketing-app` with its own `package.json`), then later extract shared tokens via a `packages/ui` workspace when we reach P1.2.

## Core Dependencies
- `next@16`, `react@19`, `typescript@5`
- `contentful`, `contentful-management`
- `launchdarkly-js-client-sdk`
- `@segment/analytics-next`
- `@vercel/analytics` (optional)
- `@radix-ui/react-*`, `tailwindcss`, `clsx`, `lucide-react`, `shadcn/ui`
- `three`, `react-three-fiber` (for tribe map)

## i18n + Routing Strategy
- Use Next.js `i18n` config with locales `['en', 'fr', 'pt', 'ar']` and default `en`.
- Accept locale-specific domains when ready (e.g., `fr.tribalmingle.com`). For now, rely on path segments `/fr/*`.
- Contentful entries store locale content; fallback to default locale if not localized.

## Personalization Hooks
- Query params `?ref=` for referral; hero component reads referral metadata from Contentful and LaunchDarkly flag variations.
- Use LaunchDarkly JS client in edge-safe mode (client-side) to pick hero variant; server components prefetch default variant for SEO.

## Data Fetching
- Use Route Handlers `/api/cms/*` as caching proxy if needed; otherwise fetch directly from Contentful with ISR and `cache: 'force-cache'`.
- Use revalidate tags (per entry type) to purge caches when Webhooks hit `/api/cms/revalidate`.

## Next Actions
1. Initialize `/marketing-app` Next.js project with pnpm workspace config.
2. Add base layout, locale routing, placeholder hero/testimonial sections.
3. Wire `.env.example` for Contentful/LaunchDarkly/Segment tokens (pending WHAT_I_NEED).
4. Set up lint/test scripts + CI placeholder.
