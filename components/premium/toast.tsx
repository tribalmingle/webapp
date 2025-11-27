'use client'

import { toast as sonnerToast, Toaster as SonnerToaster } from 'sonner'
import { CheckCircle2, XCircle, AlertCircle, Info, Sparkles } from 'lucide-react'

export function PremiumToaster() {
  return (
    <SonnerToaster
      position="top-right"
      toastOptions={{
        classNames: {
          toast: 'bg-background-secondary border-2 border-purple-royal/20 shadow-premium backdrop-blur-sm',
          title: 'text-text-primary font-semibold',
          description: 'text-text-secondary',
          actionButton: 'bg-gold-gradient text-background-primary font-semibold hover:scale-105 transition-transform',
          cancelButton: 'bg-background-tertiary text-text-secondary hover:bg-background-tertiary/80',
          closeButton: 'bg-background-tertiary border border-purple-royal/20 hover:bg-purple-royal/10',
          success: 'border-green-500/40',
          error: 'border-red-500/40',
          warning: 'border-yellow-500/40',
          info: 'border-blue-500/40',
        },
      }}
      icons={{
        success: <CheckCircle2 className="h-5 w-5 text-green-400" />,
        error: <XCircle className="h-5 w-5 text-red-400" />,
        warning: <AlertCircle className="h-5 w-5 text-yellow-400" />,
        info: <Info className="h-5 w-5 text-blue-400" />,
      }}
    />
  )
}

// Premium toast helper functions
export const toast = {
  success: (message: string, description?: string) => {
    return sonnerToast.success(message, {
      description,
      duration: 4000,
    })
  },
  
  error: (message: string, description?: string) => {
    return sonnerToast.error(message, {
      description,
      duration: 5000,
    })
  },
  
  warning: (message: string, description?: string) => {
    return sonnerToast.warning(message, {
      description,
      duration: 4000,
    })
  },
  
  info: (message: string, description?: string) => {
    return sonnerToast.info(message, {
      description,
      duration: 4000,
    })
  },
  
  premium: (message: string, description?: string) => {
    return sonnerToast(message, {
      description,
      icon: <Sparkles className="h-5 w-5 text-gold-warm" />,
      className: 'border-gold-warm/40 shadow-glow-gold',
      duration: 5000,
    })
  },
  
  promise: <T,>(
    promise: Promise<T>,
    {
      loading,
      success,
      error,
    }: {
      loading: string
      success: string | ((data: T) => string)
      error: string | ((error: any) => string)
    }
  ) => {
    return sonnerToast.promise(promise, {
      loading,
      success,
      error,
    })
  },
}
