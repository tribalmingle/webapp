import { MetadataRoute } from 'next'
import { DATING_TIPS } from '@/lib/dating-tips/tips-data'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://tribalmingle.com'
  const locales = ['en', 'fr', 'pt', 'ar']

  // Generate sitemap entries for all posts across all locales
  const postEntries: MetadataRoute.Sitemap = []

  locales.forEach((locale) => {
    // Add listing page
    postEntries.push({
      url: `${baseUrl}/${locale}/dating-tips`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    })

    // Add individual post pages
    DATING_TIPS.forEach((tip) => {
      postEntries.push({
        url: `${baseUrl}/${locale}/dating-tips/${tip.id}`,
        lastModified: new Date(tip.publishedAt),
        changeFrequency: 'monthly',
        priority: 0.7,
      })
    })
  })

  return postEntries
}
