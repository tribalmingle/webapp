import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Calendar, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DATING_TIPS } from '@/lib/dating-tips/tips-data'
import { SiteHeader } from '@/components/marketing/site-header'
import { SiteFooter } from '@/components/marketing/site-footer'

export const metadata = {
  title: 'Dating Advice & Tips | Tribal Mingle',
  description: 'Expert dating advice for building meaningful relationships in the African diaspora community',
}

export default function DatingTipsPage() {
  const sortedTips = [...DATING_TIPS].sort((a, b) => 
    new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  )

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    })
  }

  return (
    <div className="min-h-screen bg-background-primary">
      <SiteHeader locale="en" />
      
      <main className="pt-24 pb-16">
        {/* Hero Section */}
        <section className="bg-gradient-to-b from-purple-50 to-white py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <Badge variant="purple" className="mb-4">
                Expert Advice
              </Badge>
              <h1 className="text-display-lg font-display text-purple-royal-dark mb-4">
                Dating Advice & Tips
              </h1>
              <p className="text-body-lg text-neutral-700 max-w-3xl mx-auto">
                Practical guidance for building meaningful relationships in the African diaspora
              </p>
            </div>
          </div>
        </section>

        {/* Tips Grid */}
        <section className="py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {sortedTips.map((tip) => (
                <article
                  key={tip.id}
                  className="flex flex-col rounded-2xl border border-neutral-200 bg-white overflow-hidden shadow-lg hover:shadow-xl transition-all"
                >
                  {/* Featured Image */}
                  <div className="relative h-48 w-full overflow-hidden">
                    <Image
                      src={tip.featuredImage}
                      alt={tip.title}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>

                  {/* Content */}
                  <div className="p-6 flex-1 flex flex-col">
                    <Badge variant="outline" className="self-start mb-3 text-xs">
                      {tip.category.replace('-', ' ')}
                    </Badge>

                    <h3 className="text-h3 font-display text-purple-royal-dark mb-3">
                      {tip.title}
                    </h3>

                    <p className="text-body-sm text-neutral-700 mb-4 flex-1">
                      {tip.excerpt}
                    </p>

                    {/* Author & Meta */}
                    <div className="flex items-center justify-between text-xs text-neutral-600 mb-4 pb-4 border-t border-neutral-100 pt-4">
                      <div className="flex items-center gap-2">
                        <Image
                          src="/cc-author.jpg"
                          alt="CC Author"
                          width={32}
                          height={32}
                          className="w-8 h-8 rounded-full object-cover ring-2 ring-purple-royal/30"
                        />
                        <div>
                          <p className="font-bold text-purple-royal">Love Clinic by CC</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(tip.publishedAt)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {tip.readingTime} min
                        </span>
                      </div>
                    </div>

                    <Link href={`/dating-tips/${tip.id}`}>
                      <Button variant="default" className="w-full bg-purple-gradient text-white font-semibold">
                        Read More <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>

      <SiteFooter locale="en" />
    </div>
  )
}
