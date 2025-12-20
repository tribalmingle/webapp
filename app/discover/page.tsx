"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function DiscoverRedirect() {
  const router = useRouter()
  
  useEffect(() => {
    router.replace('/dashboard-spa?view=discover')
  }, [router])
  
  return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-muted-foreground">Redirecting to discover...</p>
    </div>
  )
}
