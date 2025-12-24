import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'
import { Calendar, Clock, ArrowLeft, Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { DATING_TIPS } from '@/lib/dating-tips/tips-data'
import { SiteHeader } from '@/components/marketing/site-header'
import { SiteFooter } from '@/components/marketing/site-footer'
import { PostSidebar } from '@/components/dating-tips/PostSidebar'
import { ShareButton } from '@/components/dating-tips/ShareButton'
import { ReadingProgress } from '@/components/dating-tips/ReadingProgress'

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

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id, locale } = await params
  const tip = DATING_TIPS.find((t) => t.id === id)

  if (!tip) {
    return {
      title: 'Article Not Found',
    }
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://tribalmingle.com'
  const url = `${baseUrl}/${locale}/dating-tips/${id}`

  return {
    title: `${tip.title} | Dating Tips - Tribal Mingle`,
    description: tip.excerpt,
    openGraph: {
      title: tip.title,
      description: tip.excerpt,
      url,
      siteName: 'Tribal Mingle',
      images: [
        {
          url: tip.featuredImage,
          width: 1200,
          height: 630,
          alt: tip.title,
        },
      ],
      type: 'article',
      publishedTime: tip.publishedAt,
      authors: ['Love Clinic by CC'],
      tags: tip.tags,
    },
    twitter: {
      card: 'summary_large_image',
      title: tip.title,
      description: tip.excerpt,
      images: [tip.featuredImage],
      creator: '@tribalmingle',
    },
    alternates: {
      canonical: url,
    },
  }
}

export default async function DatingTipPage({ params }: PageProps) {
  const { id, locale } = await params
  const tip = DATING_TIPS.find((t) => t.id === id)

  if (!tip) {
    notFound()
  }

  // Get the full URL for sharing
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://tribalmingle.com'
  const fullUrl = `${baseUrl}/${locale}/dating-tips/${id}`

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

  // JSON-LD Structured Data
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: tip.title,
    description: tip.excerpt,
    image: tip.featuredImage,
    datePublished: tip.publishedAt,
    dateModified: tip.publishedAt,
    author: {
      '@type': 'Person',
      name: 'Love Clinic by CC',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Tribal Mingle',
      logo: {
        '@type': 'ImageObject',
        url: `${baseUrl}/logo.png`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': fullUrl,
    },
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      
      <ReadingProgress />
      <SiteHeader locale={locale} />

      <main className="pt-24 pb-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Back Button */}
          <Link href={`/${locale}/dating-tips`} className="inline-flex items-center gap-2 text-purple-royal hover:text-purple-royal-light mb-8">
            <ArrowLeft className="w-4 h-4" />
            Back to all tips
          </Link>

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Main Content */}
            <article className="lg:col-span-8 bg-white rounded-2xl shadow-sm border border-neutral-100 p-8">
              {/* Category Badge */}
              <Badge variant="purple" className="mb-4">
                {tip.category.replace('-', ' ')}
              </Badge>

              {/* Title */}
              <h1 className="text-4xl md:text-5xl font-display font-bold text-neutral-900 mb-6 leading-tight">
                {tip.title}
              </h1>

              {/* Author & Meta */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 pb-8 border-b border-neutral-200 gap-4">
                <div className="flex items-center gap-3">
                  <Image
                    src="/cc-author.jpg"
                    alt="CC Author"
                    width={48}
                    height={48}
                    className="w-12 h-12 rounded-full object-cover ring-2 ring-purple-royal/30"
                  />
                  <div>
                    <p className="text-sm text-neutral-600">Written by</p>
                    <p className="font-semibold text-neutral-900">Love Clinic by CC</p>
                  </div>
                </div>
                <div className="flex flex-col items-start sm:items-end gap-1 text-sm text-neutral-600">
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
                {tip.content.split('\n\n').map((block, index) => {
                  const trimmed = block.trim()
                  if (!trimmed) return null

                  // Check if it's a main heading (starts with **)
                  if (trimmed.startsWith('**') && !trimmed.includes(':')) {
                    const headingMatch = trimmed.match(/^\*\*(.+?)\*\*/)
                    if (headingMatch) {
                      // Check if it's a numbered section heading like **1. Title**
                      if (headingMatch[1].match(/^\d+\./)) {
                        return (
                          <h3 key={index} className="text-xl font-display font-bold text-purple-royal-dark mt-8 mb-4 first:mt-0">
                            {headingMatch[1]}
                          </h3>
                        )
                      }
                      // Regular section heading
                      return (
                        <h3 key={index} className="text-2xl font-display font-bold text-neutral-900 mt-10 mb-4 first:mt-0">
                          {headingMatch[1]}
                        </h3>
                      )
                    }
                  }

                  // Check if it's a sub-section with bold label (e.g., **Scenario 1:** or **Traditional pressure:**)
                  if (trimmed.startsWith('**') && trimmed.includes(':')) {
                    const labelMatch = trimmed.match(/^\*\*(.+?)\*\*/)
                    if (labelMatch) {
                      // Extract the label and the rest of the text
                      const label = labelMatch[1]
                      const restText = trimmed.substring(labelMatch[0].length).trim()
                      return (
                        <div key={index} className="mt-6 mb-3">
                          <p className="text-base text-neutral-800 leading-relaxed">
                            <span className="font-bold text-purple-royal-dark">{label}</span>
                            {restText && ` ${restText}`}
                          </p>
                        </div>
                      )
                    }
                  }

                  // Check if it's a bullet list item
                  if (trimmed.startsWith('-') || trimmed.startsWith('•')) {
                    const text = trimmed.substring(1).trim()
                    return (
                      <div key={index} className="flex gap-3 mb-2 ml-4">
                        <span className="text-purple-royal-dark font-bold mt-1">•</span>
                        <p className="text-base text-neutral-800 leading-relaxed flex-1">
                          {text}
                        </p>
                      </div>
                    )
                  }

                  // Check if it's a numbered list item
                  if (trimmed.match(/^\d+\.\s/)) {
                    return (
                      <p key={index} className="text-base text-neutral-800 mb-3 ml-6 leading-relaxed">
                        {trimmed}
                      </p>
                    )
                  }

                  // Regular paragraph
                  return (
                    <p key={index} className="text-base text-neutral-800 mb-6 leading-relaxed">
                      {trimmed}
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
                <Button variant="default" className="flex-1 bg-purple-gradient text-white font-semibold">
                  <Heart className="w-4 h-4 mr-2" />
                  Save for Later
                </Button>
                <ShareButton
                  url={fullUrl}
                  title={tip.title}
                  description={tip.excerpt}
                  hashtags={tip.tags}
                  className="flex-1 bg-gold-warm text-white font-semibold hover:bg-gold-warm/90"
                />
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
                    <Button size="lg" className="bg-purple-gradient text-white font-semibold">
                      Join Tribal Mingle
                    </Button>
                  </Link>
                </div>
              </Card>

              {/* Related Tips */}
              {relatedTips.length > 0 && (
                <section className="bg-gradient-to-br from-purple-50 to-neutral-50 py-12 -mx-8 px-8 rounded-2xl">
                  <h2 className="text-3xl font-display font-bold text-neutral-900 mb-8">
                    Similar Articles
                  </h2>
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {relatedTips.map((relatedTip) => (
                      <Link key={relatedTip.id} href={`/${locale}/dating-tips/${relatedTip.id}`}>
                        <Card className="h-full hover:shadow-xl transition-all bg-white">
                          <div className="relative h-40 w-full overflow-hidden rounded-t-xl">
                            <Image
                              src={relatedTip.featuredImage}
                              alt={relatedTip.title}
                              fill
                              className="object-cover"
                              unoptimized
                            />
                          </div>
                          <div className="p-4">
                            <h3 className="text-lg font-display font-semibold text-neutral-900 mb-2 line-clamp-2">
                              {relatedTip.title}
                            </h3>
                            <p className="text-sm text-neutral-600 line-clamp-2">
                              {relatedTip.excerpt}
                            </p>
                          </div>
                        </Card>
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              {/* Comments Placeholder */}
              <section className="mt-12">
                <h2 className="text-2xl font-display font-bold text-neutral-900 mb-6">
                  Comments
                </h2>
                <Card className="p-8 text-center bg-neutral-50 border-neutral-200">
                  <p className="text-neutral-700 mb-4">
                    Comments feature coming soon! Join the conversation on our community forums.
                  </p>
                  <Link href="/community">
                    <Button variant="default" className="bg-purple-gradient text-white font-semibold">
                      Visit Community
                    </Button>
                  </Link>
                </Card>
              </section>
            </article>

            {/* Sidebar - Hidden on mobile, visible on large screens */}
            <aside className="lg:col-span-4 hidden lg:block">
              <div className="sticky top-24">
                <PostSidebar currentPostId={tip.id} allPosts={DATING_TIPS} />
              </div>
            </aside>
          </div>
        </div>
      </main>

      <SiteFooter locale={locale} />
    </div>
  )
}
