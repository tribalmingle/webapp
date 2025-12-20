'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function SafetyRedirect() {
  const router = useRouter()
  
  useEffect(() => {
    router.replace('/dashboard-spa?view=safety')
  }, [router])
  
  return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-muted-foreground">Redirecting to safety...</p>
    </div>
  )
}
