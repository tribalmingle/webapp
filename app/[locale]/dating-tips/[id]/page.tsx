import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Calendar, Clock, ArrowLeft, Share2, Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { DATING_TIPS } from '@/lib/dating-tips/tips-data'

type PageProps = {
  params: Promise<{
    locale: string
    id: string
  }>
}

export async function generateStaticParams() {
  return DATING_TIPS.map((tip) => ({
    id: tip.id,
  }))
}

export default async function DatingTipPage({ params }: PageProps) {
  const { id, locale } = await params
  const tip = DATING_TIPS.find((t) => t.id === id)

  if (!tip) {
    notFound()
  }

  const relatedTips = DATING_TIPS
    .filter((t) => t.id !== tip.id && t.category === tip.category)
    .slice(0, 3)

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="min-h-screen bg-background-primary">
      {/* Header - matches landing page */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border-gold/20 bg-hero-gradient">
        <div className="relative mx-auto flex h-14 md:h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href={`/${locale}`}>
            <img src="/triballogo.png" alt="TribalMingle" className="h-12 md:h-14 w-auto" />
          </Link>
          <nav className="hidden items-center gap-8 text-sm font-semibold text-text-secondary md:flex">
            <Link href={`/${locale}#features`} className="transition-colors hover:text-purple-royal">
              How It Works
            </Link>
            <Link href={`/${locale}#stories`} className="transition-colors hover:text-purple-royal">
              Success Stories
            </Link>
            <Link href={`/${locale}#events`} className="transition-colors hover:text-purple-royal">
              Events
            </Link>
            <Link href={`/${locale}/dating-tips`} className="transition-colors hover:text-purple-royal">
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
              <Button className="bg-purple-gradient">
                Join Tribal Mingle
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="pt-24 pb-16">
        <article className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          {/* Back Button */}
          <Link href={`/${locale}/dating-tips`} className="inline-flex items-center gap-2 text-purple-royal hover:text-purple-royal-light mb-8">
            <ArrowLeft className="w-4 h-4" />
            Back to all tips
          </Link>

          {/* Category Badge */}
          <Badge variant="purple" className="mb-4">
            {tip.category.replace('-', ' ')}
          </Badge>

          {/* Title */}
          <h1 className="text-display-lg font-display text-purple-royal-dark mb-6">
            {tip.title}
          </h1>

          {/* Author & Meta */}
          <div className="flex items-center justify-between mb-8 pb-8 border-b border-neutral-200">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-royal to-gold-warm flex items-center justify-center text-white font-bold text-lg">
                CC
              </div>
              <div>
                <p className="text-sm">Written by</p>
                <p className="font-bold text-purple-royal">Moving on Clinic by CC</p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1 text-sm text-neutral-600">
              <span className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {formatDate(tip.publishedAt)}
              </span>
              <span className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                {tip.readingTime} min read
              </span>
            </div>
          </div>

          {/* Featured Image */}
          <div className="relative h-[400px] w-full overflow-hidden rounded-2xl mb-8">
            <Image
              src={tip.featuredImage}
              alt={tip.title}
              fill
              className="object-cover"
              unoptimized
              priority
            />
          </div>

          {/* Content */}
          <div className="prose prose-lg max-w-none mb-12">
            {tip.content.split('\n\n').map((paragraph, index) => {
              if (paragraph.startsWith('**') && paragraph.endsWith('**')) {
                return (
                  <h3 key={index} className="text-h3 font-display text-purple-royal-dark mt-8 mb-4">
                    {paragraph.replace(/\*\*/g, '')}
                  </h3>
                )
              }
              return (
                <p key={index} className="text-body text-neutral-700 mb-4 leading-relaxed">
                  {paragraph}
                </p>
              )
            })}
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-8">
            {tip.tags.map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                #{tag}
              </Badge>
            ))}
          </div>

          {/* Share Actions */}
          <div className="flex items-center gap-4 p-6 bg-neutral-50 rounded-xl mb-12">
            <Button variant="outline" className="flex-1">
              <Heart className="w-4 h-4 mr-2" />
              Save for Later
            </Button>
            <Button variant="outline" className="flex-1">
              <Share2 className="w-4 h-4 mr-2" />
              Share Article
            </Button>
          </div>

          {/* CTA Card */}
          <Card className="p-8 bg-gradient-to-br from-purple-50 to-gold-50 border-2 border-purple-royal/20 mb-12">
            <div className="text-center">
              <h3 className="text-h2 font-display text-purple-royal-dark mb-4">
                Ready to Find Your Perfect Match?
              </h3>
              <p className="text-body text-neutral-700 mb-6 max-w-2xl mx-auto">
                Join thousands of singles building intentional relationships in the African diaspora
              </p>
              <Link href="/sign-up">
                <Button size="lg" className="bg-purple-gradient">
                  Join Tribal Mingle
                </Button>
              </Link>
            </div>
          </Card>
        </article>

        {/* Related Tips */}
        {relatedTips.length > 0 && (
          <section className="bg-neutral-50 py-16 mt-16">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <h2 className="text-h1 font-display text-purple-royal-dark mb-8 text-center">
                Similar Articles
              </h2>
              <div className="grid gap-8 md:grid-cols-3">
                {relatedTips.map((relatedTip) => (
                  <Link key={relatedTip.id} href={`/${locale}/dating-tips/${relatedTip.id}`}>
                    <Card className="h-full hover:shadow-xl transition-all">
                      <div className="relative h-48 w-full overflow-hidden rounded-t-xl">
                        <Image
                          src={relatedTip.featuredImage}
                          alt={relatedTip.title}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                      <div className="p-6">
                        <h3 className="text-h4 font-display text-purple-royal-dark mb-2">
                          {relatedTip.title}
                        </h3>
                        <p className="text-body-sm text-neutral-700">
                          {relatedTip.excerpt}
                        </p>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Comments Placeholder */}
        <section className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 mt-16">
          <h2 className="text-h2 font-display text-purple-royal-dark mb-6">
            Comments
          </h2>
          <Card className="p-8 text-center">
            <p className="text-neutral-600">
              Comments feature coming soon! Join the conversation on our community forums.
            </p>
            <Link href="/community">
              <Button variant="outline" className="mt-4">
                Visit Community
              </Button>
            </Link>
          </Card>
        </section>
      </main>

      {/* Footer - matches landing page */}
      <footer className="relative bg-neutral-950 border-t border-white/10 py-16 text-neutral-400">
        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-xs text-neutral-600">
            © {new Date().getFullYear()} Tribal Mingle. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
