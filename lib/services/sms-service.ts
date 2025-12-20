/**
 * Unified SMS Service
 * Primary: Termii (cheaper for African numbers)
 * Fallback: Twilio (premium reliability)
 */

import * as termii from '../vendors/termii-client'
import * as twilio from '../vendors/twilio-client'

const isDev = process.env.NODE_ENV === 'development'

export interface SMSOptions {
  to: string // Phone number in international format
  message: string
}

export interface OTPOptions {
  phoneNumber: string
  length?: number
  expiry?: number
}

export interface VerifyOTPOptions {
  phoneNumber: string
  otp: string
}

export interface SendSMSResult {
  success: boolean
  provider: 'termii' | 'twilio'
  messageId?: string
  sessionId?: string
  to: string
  error?: string
}

export interface SendOTPResult {
  success: boolean
  provider: 'termii' | 'twilio'
  sessionId?: string
  to: string
  error?: string
}

export interface VerifyOTPResult {
  success: boolean
  verified: boolean
  provider: 'termii' | 'twilio'
  error?: string
}

/**
 * Send SMS with fallback strategy
 * Try Termii first, fallback to Twilio
 */
export async function sendSMS(options: SMSOptions): Promise<SendSMSResult> {
  if (isDev) console.log('[sms-service] Attempting to send SMS', { to: options.to, provider: 'termii' })

  // Try Termii first (cheaper for African numbers)
  if (process.env.TERMII_API_KEY) {
    try {
      const result = await termii.sendSMSViaTermii({
        to: options.to,
        message: options.message,
      })
      return {
        success: result.success,
        provider: 'termii',
        messageId: result.messageId,
        to: options.to,
      }
    } catch (error) {
      if (isDev) console.error('[sms-service] Termii failed, attempting fallback to Twilio', {
        to: options.to,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  // Fallback to Twilio
  if (process.env.TWILIO_ACCOUNT_SID) {
    try {
      const result = await twilio.sendSMS({
        to: options.to,
        message: options.message,
      })

      return {
        success: result.status === 'sent',
        provider: 'twilio',
        messageId: result.status === 'sent' ? result.sid : undefined,
        to: options.to,
        error: result.status === 'failed' ? result.error : undefined,
      }
    } catch (error) {
      if (isDev) console.error('[sms-service] Twilio also failed', {
        to: options.to,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  return {
    success: false,
    provider: 'twilio',
    to: options.to,
    error: 'No SMS provider configured (Termii or Twilio)',
  }
}

/**
 * Send OTP with fallback strategy
 * Try Termii first, fallback to Twilio Verify
 */
export async function sendOTP(options: OTPOptions): Promise<SendOTPResult> {
  if (isDev) console.log('[sms-service] Attempting to send OTP', {
    to: options.phoneNumber,
    provider: 'termii',
  })
  console.log('[sms-service] TERMII_API_KEY for OTP:', process.env.TERMII_API_KEY ? 'SET' : 'NOT SET')

  // Try Termii first (cheaper for African numbers)
  if (process.env.TERMII_API_KEY) {
    console.log('[sms-service] Trying Termii OTP...')
    try {
      const result = await termii.sendOTPViaTermii({
        phoneNumber: options.phoneNumber,
        length: options.length,
        expiry: options.expiry,
      })
      return {
        success: result.success,
        provider: 'termii',
        sessionId: result.sessionId,
        to: options.phoneNumber,
      }
    } catch (error) {
      console.error('[sms-service] Termii OTP failed:', error)
      if (isDev) console.error('[sms-service] Termii OTP failed, attempting fallback to Twilio', {
        to: options.phoneNumber,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  // Fallback to Twilio Verify
  if (process.env.TWILIO_VERIFY_SERVICE_SID) {
    try {
      const result = await twilio.sendVerificationCode({
        to: options.phoneNumber,
        channel: 'sms',
      })

      return {
        success: result.status === 'sent',
        provider: 'twilio',
        sessionId: result.status === 'sent' ? result.sid : undefined,
        to: options.phoneNumber,
        error: result.status === 'failed' ? result.error : undefined,
      }
    } catch (error) {
      if (isDev) console.error('[sms-service] Twilio Verify also failed', {
        to: options.phoneNumber,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  return {
    success: false,
    provider: 'twilio',
    to: options.phoneNumber,
    error: 'No OTP provider configured (Termii or Twilio)',
  }
}

/**
 * Verify OTP with fallback strategy
 * Try Termii first, fallback to Twilio Verify
 */
export async function verifyOTP(options: VerifyOTPOptions): Promise<VerifyOTPResult> {
  if (isDev) console.log('[sms-service] Attempting to verify OTP', {
    to: options.phoneNumber,
    provider: 'termii',
  })

  // Try Termii first
  if (process.env.TERMII_API_KEY) {
    try {
      const result = await termii.verifyOTPViaTermii({
        phoneNumber: options.phoneNumber,
        otp: options.otp,
      })
      return {
        success: result.success,
        verified: result.verified,
        provider: 'termii',
      }
    } catch (error) {
      if (isDev) console.error('[sms-service] Termii OTP verification failed, attempting fallback', {
        to: options.phoneNumber,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  // Fallback to Twilio Verify
  if (process.env.TWILIO_VERIFY_SERVICE_SID) {
    try {
      const result = await twilio.checkVerificationCode({
        to: options.phoneNumber,
        code: options.otp,
      })

      return {
        success: result.valid,
        verified: result.valid,
        provider: 'twilio',
        error: result.valid ? undefined : result.error,
      }
    } catch (error) {
      if (isDev) console.error('[sms-service] Twilio Verify verification also failed', {
        to: options.phoneNumber,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  return {
    success: false,
    verified: false,
    provider: 'twilio',
    error: 'No OTP provider configured (Termii or Twilio)',
  }
}

/**
 * Validate phone number
 * Uses Termii or Twilio to validate phone numbers
 */
export async function validatePhoneNumber(phoneNumber: string): Promise<boolean> {
  if (isDev) console.log('[sms-service] Validating phone number', {
    phoneNumber,
    provider: 'termii',
  })

  // Try Termii first
  if (process.env.TERMII_API_KEY) {
    try {
      const result = await termii.validatePhoneNumberViaTermii(phoneNumber)
      return result.valid
    } catch (error) {
      if (isDev) console.error('[sms-service] Termii validation failed, attempting fallback', {
        phoneNumber,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  // Fallback to Twilio
  if (process.env.TWILIO_ACCOUNT_SID) {
    try {
      const result = await twilio.validatePhoneNumber(phoneNumber)
      return result.valid
    } catch (error) {
      if (isDev) console.error('[sms-service] Twilio validation also failed', {
        phoneNumber,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  return false
}
