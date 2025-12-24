'use client'

import { useState } from 'react'
import { Share2, Facebook, Linkedin, MessageCircle, Link as LinkIcon, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import {
  shareOnTwitter,
  shareOnFacebook,
  shareOnLinkedIn,
  shareOnWhatsApp,
  copyToClipboard,
  nativeShare,
  isNativeShareAvailable,
} from '@/lib/utils/share'

interface ShareButtonProps {
  url: string
  title: string
  description: string
  hashtags?: string[]
  className?: string
}

export function ShareButton({ url, title, description, hashtags, className }: ShareButtonProps) {
  const [isOpen, setIsOpen] = useState(false)

  const handleNativeShare = async () => {
    const success = await nativeShare({ url, title, description, hashtags })
    if (success) {
      toast.success('Shared successfully!')
      setIsOpen(false)
    }
  }

  const handleTwitterShare = () => {
    shareOnTwitter({ url, title, hashtags })
    toast.success('Opening Twitter...')
    setIsOpen(false)
  }

  const handleFacebookShare = () => {
    shareOnFacebook({ url, title })
    toast.success('Opening Facebook...')
    setIsOpen(false)
  }

  const handleLinkedInShare = () => {
    shareOnLinkedIn({ url, title, description })
    toast.success('Opening LinkedIn...')
    setIsOpen(false)
  }

  const handleWhatsAppShare = () => {
    shareOnWhatsApp({ url, title })
    toast.success('Opening WhatsApp...')
    setIsOpen(false)
  }

  const handleCopyLink = async () => {
    const success = await copyToClipboard(url)
    if (success) {
      toast.success('Link copied to clipboard!')
      setIsOpen(false)
    } else {
      toast.error('Failed to copy link')
    }
  }

  // If native share is available on mobile, use it directly
  const handleButtonClick = () => {
    if (isNativeShareAvailable() && window.innerWidth < 768) {
      handleNativeShare()
    } else {
      setIsOpen(true)
    }
  }

  return (
    <>
      <Button
        onClick={handleButtonClick}
        className={className}
      >
        <Share2 className="w-4 h-4 mr-2" />
        Share Article
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Share this article</DialogTitle>
            <DialogDescription>
              Choose your preferred platform to share this dating tip
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-3 py-4">
            {/* Twitter/X */}
            <button
              onClick={handleTwitterShare}
              className="flex flex-col items-center gap-2 p-4 rounded-lg border border-neutral-200 hover:bg-neutral-50 hover:border-neutral-300 transition-all group"
            >
              <div className="w-12 h-12 rounded-full bg-black flex items-center justify-center group-hover:scale-110 transition-transform">
                <X className="w-6 h-6 text-white" />
              </div>
              <span className="text-sm font-medium text-neutral-700">Twitter/X</span>
            </button>

            {/* Facebook */}
            <button
              onClick={handleFacebookShare}
              className="flex flex-col items-center gap-2 p-4 rounded-lg border border-neutral-200 hover:bg-neutral-50 hover:border-neutral-300 transition-all group"
            >
              <div className="w-12 h-12 rounded-full bg-[#1877F2] flex items-center justify-center group-hover:scale-110 transition-transform">
                <Facebook className="w-6 h-6 text-white fill-white" />
              </div>
              <span className="text-sm font-medium text-neutral-700">Facebook</span>
            </button>

            {/* LinkedIn */}
            <button
              onClick={handleLinkedInShare}
              className="flex flex-col items-center gap-2 p-4 rounded-lg border border-neutral-200 hover:bg-neutral-50 hover:border-neutral-300 transition-all group"
            >
              <div className="w-12 h-12 rounded-full bg-[#0A66C2] flex items-center justify-center group-hover:scale-110 transition-transform">
                <Linkedin className="w-6 h-6 text-white fill-white" />
              </div>
              <span className="text-sm font-medium text-neutral-700">LinkedIn</span>
            </button>

            {/* WhatsApp */}
            <button
              onClick={handleWhatsAppShare}
              className="flex flex-col items-center gap-2 p-4 rounded-lg border border-neutral-200 hover:bg-neutral-50 hover:border-neutral-300 transition-all group"
            >
              <div className="w-12 h-12 rounded-full bg-[#25D366] flex items-center justify-center group-hover:scale-110 transition-transform">
                <MessageCircle className="w-6 h-6 text-white fill-white" />
              </div>
              <span className="text-sm font-medium text-neutral-700">WhatsApp</span>
            </button>

            {/* Copy Link */}
            <button
              onClick={handleCopyLink}
              className="col-span-2 flex items-center justify-center gap-2 p-4 rounded-lg border-2 border-purple-700 bg-purple-50 hover:bg-purple-100 transition-all group"
            >
              <div className="w-10 h-10 rounded-full bg-purple-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                <LinkIcon className="w-5 h-5 text-white" />
              </div>
              <span className="text-sm font-semibold text-purple-900">Copy Link</span>
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
