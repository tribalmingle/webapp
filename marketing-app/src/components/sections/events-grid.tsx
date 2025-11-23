
import Link from "next/link"

interface EventItem {
  city: string
  region?: string
  date: string
  description: string
  status?: string
  href?: string
}

interface EventsGridProps {
  title: string
  items: EventItem[]
}

export function EventsGrid({ title, items }: EventsGridProps) {
  return (
    <section className="rounded-3xl border border-brand-purple/10 bg-white/90 p-8 shadow">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-brand-purple/60">Launch events</p>
          <h2 className="text-3xl font-semibold text-brand-night">{title}</h2>
        </div>
        <span className="text-sm uppercase tracking-wide text-brand-night/60">Updated weekly</span>
      </div>
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {items.map((event) => (
          <article key={`${event.city}-${event.date}`} className="flex h-full flex-col rounded-2xl border border-brand-purple/10 bg-gradient-to-br from-brand-sand/30 via-white to-brand-sand/30 p-5">
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-brand-purple">
              <span>{event.date}</span>
              {event.status ? (
                <span className="rounded-full bg-brand-purple/10 px-3 py-1 text-[10px] text-brand-purple/80">{event.status}</span>
              ) : null}
            </div>
            <div className="mt-4 space-y-1">
              <h3 className="text-xl font-semibold text-brand-night">{event.city}</h3>
              {event.region ? <p className="text-sm text-brand-night/70">{event.region}</p> : null}
            </div>
            <p className="mt-4 flex-1 text-sm leading-relaxed text-brand-night/80">{event.description}</p>
            <div className="mt-5 text-sm font-semibold">
              {event.href ? (
                <Link href={event.href} className="inline-flex items-center text-brand-purple hover:text-brand-night">
                  RSVP →
                </Link>
              ) : (
                <span className="text-brand-night/60">Details soon</span>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
