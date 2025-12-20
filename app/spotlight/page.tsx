'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function SpotlightRedirect() {
  const router = useRouter()
  
  useEffect(() => {
    router.replace('/dashboard-spa?view=spotlight')
  }, [router])
  
  return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-muted-foreground">Redirecting to spotlight...</p>
    </div>
  )
}
