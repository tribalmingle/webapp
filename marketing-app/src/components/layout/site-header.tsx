
import Link from "next/link"

export function SiteHeader({ locale }: { locale: string }) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-4 py-6">
      <Link href={`/${locale}`} className="text-xl font-semibold tracking-tight text-brand-night">
        Tribal Mingle
      </Link>
      <nav className="flex flex-wrap gap-4 text-sm font-semibold uppercase tracking-wide text-brand-night/70">
        <Link href={`/${locale}#tribes`}>
          Tribes
        </Link>
        <Link href={`/${locale}#events`}>
          Events
        </Link>
        <Link href={`/${locale}#trust`}>
          Trust
        </Link>
        <Link href={`/${locale}/admin`}>
          Admin access
        </Link>
      </nav>
    </header>
  )
}
