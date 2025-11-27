/**
 * Twilio Client
 * SMS and voice call integration for verification and premium features
 */

import twilio from 'twilio'

const ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID
const AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN
const PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER
const VERIFY_SERVICE_SID = process.env.TWILIO_VERIFY_SERVICE_SID

export type SMSResult =
  | { status: 'sent'; sid: string; to: string }
  | { status: 'skipped'; reason: string }
  | { status: 'failed'; error: string }

export type VoiceCallResult =
  | { status: 'initiated'; sid: string; to: string }
  | { status: 'skipped'; reason: string }
  | { status: 'failed'; error: string }

export type PhoneValidationResult = {
  valid: boolean
  formatted?: string
  countryCode?: string
  nationalFormat?: string
  carrier?: string
  type?: 'mobile' | 'landline' | 'voip'
}

/**
 * Send SMS via Twilio
 */
export async function sendSMS(params: {
  to: string
  message: string
  statusCallback?: string
}): Promise<SMSResult> {
  if (!ACCOUNT_SID || !AUTH_TOKEN || !PHONE_NUMBER) {
    console.warn('[twilio] Credentials missing – skipping SMS', { to: params.to })
    return { status: 'skipped', reason: 'missing_credentials' }
  }

  try {
    const client = twilio(ACCOUNT_SID, AUTH_TOKEN)
    
    const message = await client.messages.create({
      body: params.message,
      from: PHONE_NUMBER,
      to: params.to,
      statusCallback: params.statusCallback,
    })

    console.log('[twilio] SMS sent', { sid: message.sid, to: params.to })
    return { status: 'sent', sid: message.sid, to: params.to }
  } catch (error) {
    console.error('[twilio] SMS failed', { to: params.to, error })
    return {
      status: 'failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Send verification code via Twilio Verify
 */
export async function sendVerificationCode(params: {
  to: string
  channel?: 'sms' | 'call'
}): Promise<SMSResult> {
  if (!ACCOUNT_SID || !AUTH_TOKEN || !VERIFY_SERVICE_SID) {
    console.warn('[twilio] Verify service missing – skipping verification', {
      to: params.to,
    })
    return { status: 'skipped', reason: 'missing_credentials' }
  }

  try {
    const client = twilio(ACCOUNT_SID, AUTH_TOKEN)

    const verification = await client.verify.v2
      .services(VERIFY_SERVICE_SID)
      .verifications.create({
        to: params.to,
        channel: params.channel || 'sms',
      })

    console.log('[twilio] Verification code sent', {
      sid: verification.sid,
      to: params.to,
      status: verification.status,
    })
    return { status: 'sent', sid: verification.sid, to: params.to }
  } catch (error) {
    console.error('[twilio] Verification failed', { to: params.to, error })
    return {
      status: 'failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Check verification code via Twilio Verify
 */
export async function checkVerificationCode(params: {
  to: string
  code: string
}): Promise<{ valid: boolean; error?: string }> {
  if (!ACCOUNT_SID || !AUTH_TOKEN || !VERIFY_SERVICE_SID) {
    console.warn('[twilio] Verify service missing – skipping check')
    return { valid: false, error: 'missing_credentials' }
  }

  try {
    const client = twilio(ACCOUNT_SID, AUTH_TOKEN)

    const verificationCheck = await client.verify.v2
      .services(VERIFY_SERVICE_SID)
      .verificationChecks.create({
        to: params.to,
        code: params.code,
      })

    const valid = verificationCheck.status === 'approved'
    console.log('[twilio] Verification check', {
      to: params.to,
      valid,
      status: verificationCheck.status,
    })
    return { valid }
  } catch (error) {
    console.error('[twilio] Verification check failed', { to: params.to, error })
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Initiate voice call
 */
export async function initiateVoiceCall(params: {
  to: string
  message: string
  statusCallback?: string
}): Promise<VoiceCallResult> {
  if (!ACCOUNT_SID || !AUTH_TOKEN || !PHONE_NUMBER) {
    console.warn('[twilio] Credentials missing – skipping call', { to: params.to })
    return { status: 'skipped', reason: 'missing_credentials' }
  }

  try {
    const client = twilio(ACCOUNT_SID, AUTH_TOKEN)

    // Create TwiML for the call
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">${params.message}</Say>
</Response>`

    const call = await client.calls.create({
      twiml,
      to: params.to,
      from: PHONE_NUMBER,
      statusCallback: params.statusCallback,
    })

    console.log('[twilio] Call initiated', { sid: call.sid, to: params.to })
    return { status: 'initiated', sid: call.sid, to: params.to }
  } catch (error) {
    console.error('[twilio] Call failed', { to: params.to, error })
    return {
      status: 'failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Validate and format phone number
 */
export async function validatePhoneNumber(
  phoneNumber: string
): Promise<PhoneValidationResult> {
  if (!ACCOUNT_SID || !AUTH_TOKEN) {
    console.warn('[twilio] Credentials missing – skipping validation')
    return { valid: false }
  }

  try {
    const client = twilio(ACCOUNT_SID, AUTH_TOKEN)

    const lookup = await client.lookups.v2.phoneNumbers(phoneNumber).fetch({
      fields: 'line_type_intelligence',
    })

    return {
      valid: true,
      formatted: lookup.phoneNumber,
      countryCode: lookup.countryCode,
      nationalFormat: lookup.nationalFormat,
      carrier: lookup.lineTypeIntelligence?.carrier_name,
      type: lookup.lineTypeIntelligence?.type as
        | 'mobile'
        | 'landline'
        | 'voip'
        | undefined,
    }
  } catch (error) {
    console.error('[twilio] Phone validation failed', { phoneNumber, error })
    return { valid: false }
  }
}

/**
 * Parse Twilio webhook signature
 */
export function validateWebhookSignature(params: {
  signature: string
  url: string
  body: Record<string, unknown>
}): boolean {
  if (!AUTH_TOKEN) {
    console.warn('[twilio] Auth token missing – cannot validate signature')
    return false
  }

  try {
    return twilio.validateRequest(
      AUTH_TOKEN,
      params.signature,
      params.url,
      params.body as Record<string, string>
    )
  } catch (error) {
    console.error('[twilio] Signature validation failed', { error })
    return false
  }
}
