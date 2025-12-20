'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function ReferralsRedirect() {
  const router = useRouter()
  
  useEffect(() => {
    router.replace('/dashboard-spa?view=referrals')
  }, [router])
  
  return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-muted-foreground">Redirecting to referrals...</p>
    </div>
  )
}
