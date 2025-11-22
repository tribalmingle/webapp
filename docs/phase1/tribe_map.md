# Immersive Tribe Map – Technical Plan

## Goals
- Visualize African tribes and diaspora clusters across the globe with hover/click insights.
- Blend CMS metadata (stories, events) with static GeoJSON boundaries for immersive storytelling.
- Support progressive enhancement: SVG fallback, WebGL (MapLibre) primary.

## Scope (Phase 1)
1. Create `public/data/tribal-regions.geojson` with simplified polygons + centroids for at least 20 tribes.
2. Build reusable `<TribeMap />` client component using MapLibre GL JS + deck.gl scatter overlay.
3. Add CMS-driven tribe metadata list (name, population, city callouts) pulled from Contentful or static JSON placeholder.
4. Wire into marketing homepage (section 2) with CTA + highlight cards.
5. Instrument analytics (`tribe_map_interaction`) with selected tribe, action (hover/click), and locale.

## Architecture
```
app/[locale]/page.tsx
└── components/marketing/TribeMapSection (server wrapper)
    ├── components/marketing/tribe-map.tsx (client, MapLibre/Deck.gl canvas)
    ├── components/marketing/tribe-card.tsx (details panel)
    └── lib/marketing/tribes.ts (data loader/cache, merges CMS + JSON)
```

### Data Flow
1. Server component fetches `getTribeMapData(locale)` which returns `{ regions: GeoJSON, tribes: TribeMeta[] }`.
2. Client component receives serialized data (GeoJSON FeatureCollection + metadata) via props (limit features to <200KB using simplified polygons and bounding boxes).
3. MapLibre renders filled polygons with gradient ramp keyed by cultural density. Deck.gl scatter renders diaspora pins.
4. User interactions emit events to Segment via `trackClientEvent`. Also update detail card.

### Libraries
- `maplibre-gl` for basemap (open-source replacement for Mapbox GL JS v1 API).
- `deck.gl` for performant scatter/arc overlays (optional fallback: plain GeoJSON layer if bundle budget tight).
- `supercluster` (optional) for mobile clustering of diaspora pins.

## Data Model
```ts
type TribeRegionFeature = Feature<Polygon | MultiPolygon, {
  id: string
  name: string
  country: string
  capital?: string
  populationEstimate?: number
  color?: string
}>

type TribeMeta = {
  id: string
  name: string
  headline: string
  photo?: string
  stats: {
    homeBase: string
    diasporaCities: string[]
    population: string
  }
  contentfulEntryId?: string
}
```

## Interaction Requirements
- Hover: highlight polygon, update detail card, fire throttled analytics (1 per tribe per session).
- Click/Tap: lock selection, show CTA (“See stories from Ashanti members”).
- Accessibility: keyboard focus cycles through `tribes[]`, updates aria-live region summarizing stats.
- Fallback: when WebGL unsupported, render static SVG map snapshot with clickable list.

## Performance & Bundling
- Lazy load `maplibre-gl` (dynamic import with `use client`).
- Ships only to desktop/tablet by default; mobile receives simplified list until map is in viewport (IntersectionObserver).
- GeoJSON trimmed via `mapshaper` (topology-preserving) to keep <150 KB.
- Use `next/dynamic` to isolate heavy libs from base marketing bundle.

## Testing Plan
1. Unit: `lib/marketing/tribes.test.ts` for data merge (CMS + JSON) and locale filtering.
2. Component: Jest/Vitest DOM test verifying fallback list renders when `window.matchMedia('(pointer: coarse)')` matches.
3. Visual smoke: Playwright screenshot test (future) to ensure map loads.
4. Analytics: mock `trackClientEvent` to assert hover/click events produced with correct payload.

## Acceptance Criteria
- Map renders within 1.5s on desktop over fast 3G (when in viewport).
- Supports 20+ tribes with distinct colors + metadata.
- Analytics event contains `{ locale, tribeId, interactionType }`.
- Fallback list accessible via keyboard and screen readers.
- No blocking scripts > 150 KB added to initial marketing bundle (lazy loaded when visible).

## Open Questions
- Source of tribe polygons (custom dataset vs. Natural Earth + manual tracing) – for MVP, start with simplified custom GeoJSON committed to repo.
- Should diaspora pins auto-refresh via API? Phase 1 scope uses static curated coordinates.
- Need Contentful model (`tribeStory`) later; placeholder JSON until ready.

## Implementation Status (Nov 20, 2025)
- `public/data/tribal-regions.geojson` includes 22 simplified tribe polygons + centroids for MVP coverage.
- Data loader `lib/marketing/tribes.ts` merges cached GeoJSON with curated metadata (headlines, stats, CTA copy).
- New API endpoint `app/api/analytics/track` accepts `tribe_map_interaction` events from the client and forwards to Segment via `trackServerEvent`.
- Client-side analytics helper `lib/analytics/client.ts` uses `sendBeacon`/fetch for low-latency instrumentation.
- UI stack:
  - `components/marketing/tribe-map-section.tsx` (server) fetches data per locale and renders section shell.
  - `components/marketing/tribe-map.tsx` (client) lazy-loads MapLibre, handles hover/click/list selection, and provides an accessibility-friendly fallback list.
  - `components/marketing/tribe-card.tsx` displays active tribe stats + CTA.
- Coverage: tests for data loader (`tests/lib/tribes.test.ts`) and fallback rendering (`tests/components/tribe-map.test.tsx`).
``