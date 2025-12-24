import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface SiteFooterProps {
  locale?: string
  dictionary?: {
    footer: {
      company: string
      about: string
      product: string
      features: string
      legal: string
      privacy: string
      terms: string
      contact: string
      copyright: string
    }
  }
}

const defaultDictionary = {
  footer: {
    company: 'Company',
    about: 'About',
    product: 'Product',
    features: 'Features',
    legal: 'Legal',
    privacy: 'Privacy Policy',
    terms: 'Terms of Service',
    contact: 'Contact',
    copyright: 'All rights reserved.',
  }
}

export function SiteFooter({ locale = 'en', dictionary = defaultDictionary }: SiteFooterProps) {
  return (
    <footer className="relative bg-neutral-950 border-t border-white/10 py-16 text-neutral-400 overflow-hidden">
      <div className="absolute inset-0 bg-linear-to-b from-transparent to-purple-royal/5" />
      
      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-4 mb-0 pb-0">
          <div>
            <h4 className="font-semibold text-white">{dictionary.footer.company}</h4>
            <ul className="mt-3 space-y-2 text-sm">
              <li><Link href="/about" className="hover:text-gold-warm transition-colors">{dictionary.footer.about}</Link></li>
              <li><Link href="/blog" className="hover:text-gold-warm transition-colors">Blog</Link></li>
              <li><Link href="/careers" className="hover:text-gold-warm transition-colors">Careers</Link></li>
            </ul>
            {/* Logo - positioned right below Careers */}
            <div className="mt-4">
              <img src="/triballogo.png" alt="Tribal Mingle" className="h-32 w-auto" />
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-white">{dictionary.footer.product}</h4>
            <ul className="mt-3 space-y-2 text-sm">
              <li><Link href={`/${locale}#features`} className="hover:text-gold-warm transition-colors">{dictionary.footer.features}</Link></li>
              <li><Link href="/pricing" className="hover:text-gold-warm transition-colors">Pricing</Link></li>
              <li><Link href="/faq" className="hover:text-gold-warm transition-colors">FAQ</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-white">{dictionary.footer.legal}</h4>
            <ul className="mt-3 space-y-2 text-sm">
              <li><Link href="/privacy" className="hover:text-gold-warm transition-colors">{dictionary.footer.privacy}</Link></li>
              <li><Link href="/terms" className="hover:text-gold-warm transition-colors">{dictionary.footer.terms}</Link></li>
              <li><Link href="/help" className="hover:text-gold-warm transition-colors">{dictionary.footer.contact}</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-white">Stay Connected</h4>
            <p className="mt-3 text-sm text-neutral-500 mb-4">
              Join our waitlist for dating tips and exclusive event invites.
            </p>
            <div className="flex gap-2 mb-6">
              <Input placeholder="Enter your email" className="bg-neutral-900 border-neutral-800 text-white placeholder:text-neutral-500 focus:border-purple-royal/50" />
              <Button variant="default" size="icon" className="bg-gold-warm text-white hover:bg-gold-warm/90">
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
            <ul className="space-y-2 text-sm">
              <li><a href="https://instagram.com" className="hover:text-gold-warm transition-colors">Instagram</a></li>
              <li><a href="https://twitter.com" className="hover:text-gold-warm transition-colors">Twitter</a></li>
              <li><a href="https://linkedin.com" className="hover:text-gold-warm transition-colors">LinkedIn</a></li>
            </ul>
          </div>
        </div>
        
        <div className="mt-10 border-t border-white/10 pt-6 text-center text-xs text-neutral-600">
          &copy; {new Date().getFullYear()} Tribal Mingle. {dictionary.footer.copyright}
        </div>
      </div>
    </footer>
  )
}
