import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface SiteHeaderProps {
  locale?: string
}

export function SiteHeader({ locale = 'en' }: SiteHeaderProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border-gold/20">
      {/* Animated gradient background matching hero */}
      <div className="absolute inset-0 bg-hero-gradient">
        <div className="absolute top-0 left-20 w-64 h-64 bg-purple-royal/30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-0 right-20 w-64 h-64 bg-gold-warm/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>
      
      <div className="relative mx-auto flex h-14 md:h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href={`/${locale}`}>
          <img src="/triballogo.png" alt="TribalMingle" className="h-12 md:h-14 w-auto" />
        </Link>
        
        <nav className="hidden items-center gap-8 text-sm font-semibold text-white md:flex">
          <Link href={`/${locale}#features`} className="transition-colors hover:text-gold-warm">
            How It Works
          </Link>
          <Link href={`/${locale}#stories`} className="transition-colors hover:text-gold-warm">
            Success Stories
          </Link>
          <Link href={`/${locale}#events`} className="transition-colors hover:text-gold-warm">
            Events
          </Link>
          <Link href={`/${locale}/dating-tips`} className="transition-colors hover:text-gold-warm">
            Dating Advice & Tips
          </Link>
        </nav>
        
        <div className="hidden md:flex items-center gap-3">
          <Link href="/login">
            <Button variant="outline" size="default" className="border-gold-warm text-gold-warm hover:bg-gold-warm hover:text-white">
              Login
            </Button>
          </Link>
          <Link href="/sign-up">
            <Button className="bg-purple-gradient text-white font-semibold">
              Join Tribal Mingle
            </Button>
          </Link>
        </div>
      </div>
    </header>
  )
}
