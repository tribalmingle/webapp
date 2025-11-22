interface CtaSectionProps {
  title: string
  body: string
  button: string
}

export function CtaSection({ title, body, button }: CtaSectionProps) {
  return (
    <section className="rounded-3xl border border-brand-purple/10 bg-gradient-to-br from-brand-purple via-brand-night to-black p-8 text-white">
      <div className="max-w-3xl space-y-4">
        <p className="text-sm uppercase tracking-[0.4em] text-brand-sand/80">Early access</p>
        <h2 className="text-3xl font-semibold">{title}</h2>
        <p className="text-base text-white/80">{body}</p>
        <button className="mt-4 inline-flex items-center rounded-full bg-white/95 px-8 py-3 text-sm font-semibold uppercase tracking-wide text-brand-night transition hover:bg-white">
          {button}
        </button>
      </div>
    </section>
  )
}
