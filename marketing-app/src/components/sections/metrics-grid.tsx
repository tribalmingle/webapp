interface MetricItem {
  label: string
  value: string
}

interface MetricsGridProps {
  title: string
  items: MetricItem[]
}

export function MetricsGrid({ title, items }: MetricsGridProps) {
  return (
    <section className="space-y-6 rounded-3xl border border-brand-purple/10 bg-white/80 p-8 shadow">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-brand-night">{title}</h2>
        <div className="h-px w-32 bg-gradient-to-r from-brand-purple/50 to-transparent" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item) => (
          <div key={item.label} className="rounded-2xl border border-brand-purple/10 bg-brand-sand/30 p-4 text-center">
            <p className="text-3xl font-semibold text-brand-night">{item.value}</p>
            <p className="mt-2 text-sm font-medium uppercase tracking-wide text-brand-night/70">{item.label}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
