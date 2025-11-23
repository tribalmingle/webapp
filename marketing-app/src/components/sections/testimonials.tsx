
interface Testimonial {
  name: string
  tribe: string
  quote: string
}

interface TestimonialsSectionProps {
  title: string
  quotes: Testimonial[]
}

export function TestimonialsSection({ title, quotes }: TestimonialsSectionProps) {
  return (
    <section className="space-y-8 rounded-3xl border border-brand-purple/10 bg-brand-night text-white p-8">
      <div>
        <p className="text-xs uppercase tracking-[0.6em] text-brand-sand">Community</p>
        <h2 className="mt-2 text-3xl font-semibold">{title}</h2>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        {quotes.map((quote) => (
          <figure key={`${quote.name}-${quote.tribe}`} className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <blockquote className="text-base leading-relaxed text-white/90">“{quote.quote}”</blockquote>
            <figcaption className="mt-4 text-sm text-white/70">
              <p className="font-semibold text-white">{quote.name}</p>
              <p>{quote.tribe}</p>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  )
}
