/**
 * Social Sharing Utility Functions
 * Provides functions to share content across various platforms
 */

interface ShareOptions {
  url: string
  title: string
  description?: string
  hashtags?: string[]
}

/**
 * Share on Twitter/X
 */
export function shareOnTwitter({ url, title, hashtags }: ShareOptions): void {
  const text = encodeURIComponent(title)
  const shareUrl = encodeURIComponent(url)
  const hashtagString = hashtags ? hashtags.join(',') : ''
  
  const twitterUrl = `https://twitter.com/intent/tweet?text=${text}&url=${shareUrl}${hashtagString ? `&hashtags=${hashtagString}` : ''}`
  
  window.open(twitterUrl, '_blank', 'width=550,height=420')
}

/**
 * Share on Facebook
 */
export function shareOnFacebook({ url }: ShareOptions): void {
  const shareUrl = encodeURIComponent(url)
  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`
  
  window.open(facebookUrl, '_blank', 'width=550,height=420')
}

/**
 * Share on LinkedIn
 */
export function shareOnLinkedIn({ url, title, description }: ShareOptions): void {
  const shareUrl = encodeURIComponent(url)
  const titleParam = encodeURIComponent(title)
  const descParam = description ? encodeURIComponent(description) : ''
  
  const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`
  
  window.open(linkedInUrl, '_blank', 'width=550,height=420')
}

/**
 * Share on WhatsApp
 */
export function shareOnWhatsApp({ url, title }: ShareOptions): void {
  const text = encodeURIComponent(`${title} ${url}`)
  const whatsappUrl = `https://wa.me/?text=${text}`
  
  window.open(whatsappUrl, '_blank')
}

/**
 * Copy link to clipboard
 */
export async function copyToClipboard(url: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(url)
      return true
    } else {
      // Fallback for older browsers or non-secure contexts
      const textArea = document.createElement('textarea')
      textArea.value = url
      textArea.style.position = 'fixed'
      textArea.style.left = '-999999px'
      textArea.style.top = '-999999px'
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()
      
      const successful = document.execCommand('copy')
      textArea.remove()
      
      return successful
    }
  } catch (err) {
    console.error('Failed to copy to clipboard:', err)
    return false
  }
}

/**
 * Native Web Share API (fallback for mobile)
 */
export async function nativeShare({ url, title, description }: ShareOptions): Promise<boolean> {
  if (navigator.share) {
    try {
      await navigator.share({
        title,
        text: description,
        url,
      })
      return true
    } catch (err) {
      // User cancelled or share failed
      console.error('Native share failed:', err)
      return false
    }
  }
  return false
}

/**
 * Check if native share is available
 */
export function isNativeShareAvailable(): boolean {
  return typeof navigator !== 'undefined' && !!navigator.share
}
