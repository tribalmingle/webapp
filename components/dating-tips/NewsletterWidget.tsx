'use client'

import { useState } from 'react'
import { Mail, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { toast } from 'sonner'

export function NewsletterWidget() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email || !email.includes('@')) {
      toast.error('Please enter a valid email address')
      return
    }

    setIsLoading(true)

    // Simulate API call (replace with actual newsletter API)
    try {
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // TODO: Replace with actual newsletter service integration
      // Example: await fetch('/api/newsletter/subscribe', { method: 'POST', body: JSON.stringify({ email }) })
      
      toast.success('Successfully subscribed! Check your inbox.')
      setEmail('')
    } catch (error) {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-purple-gradient rounded-lg">
          <Mail className="w-5 h-5 text-white" />
        </div>
        <h3 className="text-lg font-display font-semibold text-purple-royal-dark">
          Dating Tips Newsletter
        </h3>
      </div>
      
      <p className="text-sm text-neutral-700 mb-4">
        Get weekly dating advice and relationship tips delivered to your inbox.
      </p>

      <form onSubmit={handleSubmit} className="space-y-3">
        <Input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isLoading}
          className="border-purple-200 focus:border-purple-royal focus:ring-purple-royal/20"
        />
        <Button
          type="submit"
          disabled={isLoading}
          className="w-full bg-purple-gradient text-white font-semibold"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Subscribing...
            </>
          ) : (
            'Subscribe'
          )}
        </Button>
      </form>

      <p className="text-xs text-neutral-600 mt-3">
        We respect your privacy. Unsubscribe anytime.
      </p>
    </Card>
  )
}
