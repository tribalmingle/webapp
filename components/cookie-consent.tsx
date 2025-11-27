/**
 * Cookie Consent Component
 * GDPR-compliant cookie consent banner
 */

'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

export type CookieCategory = 'necessary' | 'analytics' | 'marketing' | 'preferences'

export interface CookieConsent {
  necessary: boolean
  analytics: boolean
  marketing: boolean
  preferences: boolean
  timestamp: number
}

const COOKIE_CONSENT_KEY = 'cookie_consent'
const CONSENT_VERSION = '1.0'

/**
 * Get current cookie consent
 */
export function getCookieConsent(): CookieConsent | null {
  if (typeof window === 'undefined') return null
  
  const stored = localStorage.getItem(COOKIE_CONSENT_KEY)
  if (!stored) return null
  
  try {
    const consent = JSON.parse(stored)
    if (consent.version !== CONSENT_VERSION) {
      // Version mismatch, require new consent
      return null
    }
    return consent.data
  } catch {
    return null
  }
}

/**
 * Save cookie consent
 */
export function saveCookieConsent(consent: CookieConsent): void {
  localStorage.setItem(
    COOKIE_CONSENT_KEY,
    JSON.stringify({
      version: CONSENT_VERSION,
      data: consent,
    })
  )
  
  // Trigger event for analytics tracking
  window.dispatchEvent(
    new CustomEvent('cookieConsentChanged', { detail: consent })
  )
}

/**
 * Cookie consent banner component
 */
export function CookieConsentBanner() {
  const [isVisible, setIsVisible] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [preferences, setPreferences] = useState<CookieConsent>({
    necessary: true, // Always true
    analytics: false,
    marketing: false,
    preferences: false,
    timestamp: Date.now(),
  })

  useEffect(() => {
    const consent = getCookieConsent()
    if (!consent) {
      setIsVisible(true)
    }
  }, [])

  const handleAcceptAll = () => {
    const consent: CookieConsent = {
      necessary: true,
      analytics: true,
      marketing: true,
      preferences: true,
      timestamp: Date.now(),
    }
    saveCookieConsent(consent)
    setIsVisible(false)
  }

  const handleAcceptNecessary = () => {
    const consent: CookieConsent = {
      necessary: true,
      analytics: false,
      marketing: false,
      preferences: false,
      timestamp: Date.now(),
    }
    saveCookieConsent(consent)
    setIsVisible(false)
  }

  const handleSavePreferences = () => {
    const consent: CookieConsent = {
      ...preferences,
      necessary: true, // Always true
      timestamp: Date.now(),
    }
    saveCookieConsent(consent)
    setIsVisible(false)
  }

  if (!isVisible) return null

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 bg-white border-t border-gray-200 shadow-lg">
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-2">
              We value your privacy
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              We use cookies to enhance your experience, analyze site traffic, and personalize content.
              You can customize your cookie preferences or accept all cookies.
            </p>

            {showDetails && (
              <div className="space-y-3 mb-4">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="necessary"
                    checked={true}
                    disabled
                    className="mt-1"
                  />
                  <div>
                    <label htmlFor="necessary" className="font-medium text-sm">
                      Necessary Cookies (Required)
                    </label>
                    <p className="text-xs text-gray-500">
                      Essential for the website to function properly. Cannot be disabled.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="analytics"
                    checked={preferences.analytics}
                    onChange={(e) =>
                      setPreferences({ ...preferences, analytics: e.target.checked })
                    }
                    className="mt-1"
                  />
                  <div>
                    <label htmlFor="analytics" className="font-medium text-sm">
                      Analytics Cookies
                    </label>
                    <p className="text-xs text-gray-500">
                      Help us understand how visitors interact with our website.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="marketing"
                    checked={preferences.marketing}
                    onChange={(e) =>
                      setPreferences({ ...preferences, marketing: e.target.checked })
                    }
                    className="mt-1"
                  />
                  <div>
                    <label htmlFor="marketing" className="font-medium text-sm">
                      Marketing Cookies
                    </label>
                    <p className="text-xs text-gray-500">
                      Used to deliver personalized advertisements and track campaign effectiveness.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="preferences"
                    checked={preferences.preferences}
                    onChange={(e) =>
                      setPreferences({ ...preferences, preferences: e.target.checked })
                    }
                    className="mt-1"
                  />
                  <div>
                    <label htmlFor="preferences" className="font-medium text-sm">
                      Preference Cookies
                    </label>
                    <p className="text-xs text-gray-500">
                      Remember your settings and preferences for a better experience.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleAcceptAll}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium text-sm"
              >
                Accept All
              </button>
              <button
                onClick={handleAcceptNecessary}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm"
              >
                Necessary Only
              </button>
              {showDetails ? (
                <button
                  onClick={handleSavePreferences}
                  className="px-6 py-2 border border-indigo-600 text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors font-medium text-sm"
                >
                  Save Preferences
                </button>
              ) : (
                <button
                  onClick={() => setShowDetails(true)}
                  className="px-6 py-2 text-gray-700 hover:text-gray-900 font-medium text-sm underline"
                >
                  Customize
                </button>
              )}
            </div>
          </div>

          <button
            onClick={handleAcceptNecessary}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>
      </div>
    </div>
  )
}

/**
 * Hook to check if a cookie category is allowed
 */
export function useCookieConsent(category: CookieCategory): boolean {
  const [isAllowed, setIsAllowed] = useState(false)

  useEffect(() => {
    const consent = getCookieConsent()
    setIsAllowed(consent?.[category] ?? false)

    const handleConsentChange = (event: CustomEvent<CookieConsent>) => {
      setIsAllowed(event.detail[category] ?? false)
    }

    window.addEventListener('cookieConsentChanged', handleConsentChange as EventListener)
    return () => {
      window.removeEventListener('cookieConsentChanged', handleConsentChange as EventListener)
    }
  }, [category])

  return isAllowed
}

/**
 * Initialize analytics based on consent
 */
export function initializeAnalytics(): void {
  const consent = getCookieConsent()
  
  if (consent?.analytics) {
    // Initialize Google Analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('consent', 'update', {
        analytics_storage: 'granted',
      })
    }
  }
  
  if (consent?.marketing) {
    // Initialize marketing pixels
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('consent', 'update', {
        ad_storage: 'granted',
        ad_user_data: 'granted',
        ad_personalization: 'granted',
      })
    }
  }
}
