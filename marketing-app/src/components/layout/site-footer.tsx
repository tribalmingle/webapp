import Link from "next/link"

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-brand-purple/10 py-8 text-sm text-brand-night/70">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p>© {new Date().getFullYear()} Tribal Mingle. All rights reserved.</p>
        <div className="flex flex-wrap gap-3">
          <Link href="/privacy" className="hover:text-brand-night">Privacy</Link>
          <Link href="/terms" className="hover:text-brand-night">Terms</Link>
          <Link href="/press" className="hover:text-brand-night">Press</Link>
        </div>
      </div>
    </footer>
  )
}
