
import Link from "next/link"

interface BlogPost {
  title: string
  excerpt: string
  href: string
  readTime: string
}

interface BlogHighlightsProps {
  title: string
  posts: BlogPost[]
}

export function BlogHighlights({ title, posts }: BlogHighlightsProps) {
  return (
    <section className="rounded-3xl border border-brand-purple/10 bg-brand-night text-white p-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.5em] text-brand-sand/70">Field notes</p>
          <h2 className="text-3xl font-semibold">{title}</h2>
        </div>
        <Link href="/stories" className="text-sm font-semibold uppercase tracking-wide text-brand-sand/80 hover:text-white">
          View archive →
        </Link>
      </div>
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {posts.map((post) => (
          <article key={post.href} className="flex h-full flex-col rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-xs uppercase tracking-[0.5em] text-brand-sand/60">{post.readTime}</p>
            <h3 className="mt-2 text-xl font-semibold leading-tight">{post.title}</h3>
            <p className="mt-3 flex-1 text-sm text-white/80">{post.excerpt}</p>
            <div className="mt-5">
              <Link href={post.href} className="text-sm font-semibold text-brand-sand hover:text-white">
                Read story →
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
