'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function LikesRedirect() {
  const router = useRouter()
  
  useEffect(() => {
    router.replace('/dashboard-spa?view=likes')
  }, [router])
  
  return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-muted-foreground">Redirecting to likes...</p>
    </div>
  )
}
