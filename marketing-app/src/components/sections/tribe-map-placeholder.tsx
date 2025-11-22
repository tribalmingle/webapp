export function TribeMapPlaceholder() {
  return (
    <section className="rounded-3xl border border-brand-purple/10 bg-white p-8 shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-brand-purple/60">Immersive tribe map</p>
          <h2 className="mt-2 text-3xl font-semibold text-brand-night">Diaspora heat map</h2>
        </div>
        <span className="rounded-full bg-brand-purple/10 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-brand-purple">Coming soon</span>
      </div>
      <div className="mt-8 h-56 w-full rounded-2xl border border-dashed border-brand-purple/30 bg-gradient-to-br from-brand-sand via-white to-brand-sand/60" />
      <p className="mt-4 text-sm text-brand-night/70">
        This viewport will render the WebGL experience with geojson overlays once Contentful + map data sources are connected.
      </p>
    </section>
  )
}
