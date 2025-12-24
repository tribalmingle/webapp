'use client'

import { useState, useMemo, Suspense } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useSearchParams, useRouter } from 'next/navigation'
import { ArrowRight, Calendar, Clock, Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { DATING_TIPS } from '@/lib/dating-tips/tips-data'
import { SiteHeader } from '@/components/marketing/site-header'
import { SiteFooter } from '@/components/marketing/site-footer'

function DatingTipsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '')
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'all')

  // Get unique categories
  const categories = useMemo(() => {
    const cats = new Set(DATING_TIPS.map(tip => tip.category))
    return ['all', ...Array.from(cats).sort()]
  }, [])

  // Filter and sort tips
  const filteredTips = useMemo(() => {
    let tips = [...DATING_TIPS]

    // Filter by category
    if (selectedCategory !== 'all') {
      tips = tips.filter(tip => tip.category === selectedCategory)
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      tips = tips.filter(tip => 
        tip.title.toLowerCase().includes(query) ||
        tip.excerpt.toLowerCase().includes(query) ||
        tip.content.toLowerCase().includes(query)
      )
    }

    // Sort by date (newest first)
    return tips.sort((a, b) => 
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    )
  }, [searchQuery, selectedCategory])

  // Update URL with query params
  const updateFilters = (search: string, category: string) => {
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (category !== 'all') params.set('category', category)
    const queryString = params.toString()
    router.push(queryString ? `/dating-tips?${queryString}` : '/dating-tips', { scroll: false })
  }

  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    updateFilters(value, selectedCategory)
  }

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category)
    updateFilters(searchQuery, category)
  }

  const clearFilters = () => {
    setSearchQuery('')
    setSelectedCategory('all')
    router.push('/dating-tips', { scroll: false })
  }

  const hasActiveFilters = searchQuery.trim() !== '' || selectedCategory !== 'all'

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

        {/* Search & Filter Section */}
        <section className="py-8 border-b border-neutral-200">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {/* Search Bar */}
            <div className="mb-6">
              <div className="relative max-w-2xl">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                <Input
                  type="text"
                  placeholder="Search dating tips..."
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-12 pr-12 h-12 text-base border-neutral-300 focus:border-purple-royal focus:ring-purple-royal/20"
                />
                {searchQuery && (
                  <button
                    onClick={() => handleSearchChange('')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors"
                    aria-label="Clear search"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>

            {/* Category Filters */}
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-sm font-semibold text-neutral-700 mr-2">Filter by:</span>
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleCategoryChange(category)}
                  className={
                    selectedCategory === category
                      ? 'bg-purple-gradient text-white font-semibold'
                      : 'border-neutral-300 text-neutral-700 hover:border-purple-royal hover:text-purple-royal'
                  }
                >
                  {category === 'all' ? 'All Topics' : category.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                </Button>
              ))}
              
              {/* Clear Filters Button */}
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="ml-auto text-purple-royal hover:text-purple-royal-dark hover:bg-purple-50"
                >
                  <X className="w-4 h-4 mr-1" />
                  Clear Filters
                </Button>
              )}
            </div>

            {/* Results Count */}
            <div className="mt-4 text-sm text-neutral-600">
              {filteredTips.length === 0 ? (
                <p className="text-center py-8 text-base">
                  No tips found matching your filters. Try adjusting your search or filters.
                </p>
              ) : (
                <p>
                  Showing <span className="font-semibold text-purple-royal">{filteredTips.length}</span> {filteredTips.length === 1 ? 'tip' : 'tips'}
                  {hasActiveFilters && ' matching your filters'}
                </p>
              )}
            </div>
          </div>
        </section>

        {/* Tips Grid */}
        <section className="py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {filteredTips.map((tip) => (
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

export default function DatingTipsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background-primary">
        <SiteHeader locale="en" />
        <main className="pt-24 pb-16">
          <section className="bg-gradient-to-b from-purple-50 to-white py-16">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="text-center">
                <p className="text-body-lg text-neutral-700">Loading dating tips...</p>
              </div>
            </div>
          </section>
        </main>
        <SiteFooter locale="en" />
      </div>
    }>
      <DatingTipsContent />
    </Suspense>
  )
}
