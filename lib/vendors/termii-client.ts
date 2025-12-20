/**
 * Termii SMS Client
 * Handles SMS and OTP sending via Termii API
 * Best for African phone numbers
 */

const TERMII_BASE_URL = 'https://api.termii.com/api'
const isDev = process.env.NODE_ENV === 'development'

// Helper to get config at runtime
const getApiKey = () => process.env.TERMII_API_KEY || ''
const getSenderId = () => process.env.TERMII_SENDER_ID || 'Classmigo' // Classmigo is the registered sender ID

export interface SendSMSOptions {
  to: string // Phone number in international format
  message: string
  channel?: 'generic' | 'dnd' // generic or DND (Do Not Disturb)
  type?: 'plain' | 'unicode'
}

export interface SendOTPOptions {
  phoneNumber: string // Phone number in international format
  length?: number // OTP length (4-8)
  expiry?: number // Expiry in minutes
}

export interface VerifyOTPOptions {
  phoneNumber: string
  otp: string
}

/**
 * Send SMS via Termii
 */
export async function sendSMSViaTermii(options: SendSMSOptions) {
  const apiKey = getApiKey()
  if (!apiKey) {
    throw new Error('TERMII_API_KEY not configured')
  }

  try {
    const senderId = getSenderId()
    const requestBody = {
      to: options.to,
      from: senderId,
      sms: options.message,
      type: options.type || 'plain',
      channel: options.channel || 'generic',
      api_key: apiKey,
    }
    
    const response = await fetch(`${TERMII_BASE_URL}/sms/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      if (isDev) console.error('[termii] API error:', response.status, errorText)
      throw new Error(`Termii API error: ${response.statusText}`)
    }

    const data = await response.json()

    if (!data.code || (data.code !== 'ok' && data.code !== 'success')) {
      throw new Error(data.message || 'Failed to send SMS via Termii')
    }

    if (isDev) console.log('[termii] SMS sent', {
      to: options.to,
      messageId: data.message_id,
    })

    return {
      success: true,
      provider: 'termii',
      messageId: data.message_id,
      to: options.to,
    }
  } catch (error) {
    if (isDev) console.error('[termii] Send SMS error:', error)
    throw error
  }
}

/**
 * Send OTP via Termii
 */
export async function sendOTPViaTermii(options: SendOTPOptions) {
  const apiKey = getApiKey()
  if (!apiKey) {
    throw new Error('TERMII_API_KEY not configured')
  }

  try {
    const senderId = getSenderId()
    const response = await fetch(`${TERMII_BASE_URL}/otp/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: apiKey,
        message_type: 'ALPHANUMERIC',
        to: options.phoneNumber,
        from: senderId,
        length: options.length || 6,
        expiry: options.expiry || 10,
      }),
    })

    if (!response.ok) {
      throw new Error(`Termii API error: ${response.statusText}`)
    }

    const data = await response.json()

    if (!data.code || data.code !== 'success') {
      throw new Error(data.message || 'Failed to send OTP via Termii')
    }

    if (isDev) console.log('[termii] OTP sent', {
      to: options.phoneNumber,
      sessionId: data.session_id,
    })

    return {
      success: true,
      provider: 'termii',
      sessionId: data.session_id,
      to: options.phoneNumber,
    }
  } catch (error) {
    if (isDev) console.error('[termii] Send OTP error:', error)
    throw error
  }
}

/**
 * Verify OTP via Termii
 */
export async function verifyOTPViaTermii(options: VerifyOTPOptions) {
  const apiKey = getApiKey()
  if (!apiKey) {
    throw new Error('TERMII_API_KEY not configured')
  }

  try {
    const response = await fetch(`${TERMII_BASE_URL}/otp/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: apiKey,
        phone_number: options.phoneNumber,
        code: options.otp,
      }),
    })

    if (!response.ok) {
      throw new Error(`Termii API error: ${response.statusText}`)
    }

    const data = await response.json()

    const verified = data.verified === true

    if (isDev) console.log('[termii] OTP verification', {
      to: options.phoneNumber,
      verified,
    })

    return {
      success: true,
      verified,
      provider: 'termii',
    }
  } catch (error) {
    if (isDev) console.error('[termii] Verify OTP error:', error)
    throw error
  }
}

/**
 * Check if phone number is valid and can receive SMS in Termii
 */
export async function validatePhoneNumberViaTermii(phoneNumber: string) {
  const apiKey = getApiKey()
  if (!apiKey) {
    throw new Error('TERMII_API_KEY not configured')
  }

  try {
    // Termii provides a phone number lookup API
    const response = await fetch(`${TERMII_BASE_URL}/insights/phone/number`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`Termii API error: ${response.statusText}`)
    }

    const data = await response.json()

    return {
      valid: data.code === 'success',
      provider: 'termii',
      phoneNumber,
    }
  } catch (error) {
    if (isDev) console.error('[termii] Phone validation error:', error)
    // Return false on error but don't throw
    return {
      valid: false,
      provider: 'termii',
      phoneNumber,
    }
  }
}
