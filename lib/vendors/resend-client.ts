/**
 * Resend Email Client
 * Handles transactional emails via Resend API
 */

const RESEND_API_KEY = process.env.RESEND_API_KEY || ''
const RESEND_FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'Tribal Mingle <noreply@tribalmingle.com>'
const isDev = process.env.NODE_ENV === 'development'

export interface SendEmailOptions {
  to: string | string[]
  subject: string
  html: string
  text?: string
  replyTo?: string
}

export interface SendWelcomeEmailOptions {
  to: string
  name: string
  verificationUrl?: string
}

export interface SendVerificationEmailOptions {
  to: string
  name: string
  code: string
}

export interface SendPasswordResetEmailOptions {
  to: string
  name: string
  resetUrl: string
}

export interface SendRegistrationReminderEmailOptions {
  to: string
  name: string
  continueUrl: string
}

/**
 * Send email via Resend
 */
export async function sendEmailViaResend(options: SendEmailOptions) {
  if (!RESEND_API_KEY) {
    console.warn('[resend] API key not configured, skipping email send')
    return { success: false, message: 'Resend not configured' }
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: RESEND_FROM_EMAIL,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
        reply_to: options.replyTo,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      if (isDev) console.error('[resend] API error:', response.status, errorText)
      throw new Error(`Resend API error: ${response.statusText}`)
    }

    const data = await response.json()

    if (isDev) console.log('[resend] Email sent', {
      to: options.to,
      emailId: data.id,
    })

    return {
      success: true,
      provider: 'resend',
      emailId: data.id,
      to: options.to,
    }
  } catch (error) {
    if (isDev) console.error('[resend] Send email error:', error)
    throw error
  }
}

/**
 * Send welcome email to new user
 */
export async function sendWelcomeEmail(options: SendWelcomeEmailOptions) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; background: #8B5CF6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Welcome to Tribal Mingle!</h1>
        </div>
        <div class="content">
          <h2>Hi ${options.name},</h2>
          <p>Welcome to Tribal Mingle - the premium platform connecting mature African singles worldwide! We're thrilled to have you join our exclusive community.</p>
          
          <p><strong>What's Next?</strong></p>
          <ul>
            <li>Complete your profile with photos and details</li>
            <li>Verify your phone number for full access</li>
            <li>Start discovering compatible matches</li>
            <li>Join our vibrant community events</li>
          </ul>

          ${options.verificationUrl ? `
          <div style="text-align: center;">
            <a href="${options.verificationUrl}" class="button">Complete Your Profile</a>
          </div>
          ` : ''}

          <p>If you have any questions, our support team is here to help.</p>
          
          <p>Best regards,<br>The Tribal Mingle Team</p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Tribal Mingle. All rights reserved.</p>
          <p>You're receiving this email because you created an account on Tribal Mingle.</p>
        </div>
      </div>
    </body>
    </html>
  `

  const text = `
Welcome to Tribal Mingle, ${options.name}!

We're thrilled to have you join our exclusive community connecting mature African singles worldwide.

What's Next:
- Complete your profile with photos and details
- Verify your phone number for full access
- Start discovering compatible matches
- Join our vibrant community events

${options.verificationUrl ? `Complete your profile: ${options.verificationUrl}` : ''}

If you have any questions, our support team is here to help.

Best regards,
The Tribal Mingle Team
  `

  return sendEmailViaResend({
    to: options.to,
    subject: '🎉 Welcome to Tribal Mingle!',
    html,
    text,
  })
}

/**
 * Send email verification code
 */
export async function sendVerificationCodeEmail(options: SendVerificationEmailOptions) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .code { font-size: 32px; font-weight: bold; letter-spacing: 8px; text-align: center; background: white; padding: 20px; border-radius: 5px; margin: 20px 0; color: #8B5CF6; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔐 Email Verification</h1>
        </div>
        <div class="content">
          <h2>Hi ${options.name},</h2>
          <p>Here's your verification code to complete your Tribal Mingle registration:</p>
          
          <div class="code">${options.code}</div>

          <p>This code will expire in 10 minutes.</p>
          
          <p><strong>Didn't request this?</strong> You can safely ignore this email.</p>
          
          <p>Best regards,<br>The Tribal Mingle Team</p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Tribal Mingle. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `

  const text = `
Hi ${options.name},

Here's your verification code to complete your Tribal Mingle registration:

${options.code}

This code will expire in 10 minutes.

Didn't request this? You can safely ignore this email.

Best regards,
The Tribal Mingle Team
  `

  return sendEmailViaResend({
    to: options.to,
    subject: '🔐 Your Tribal Mingle Verification Code',
    html,
    text,
  })
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(options: SendPasswordResetEmailOptions) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; background: #8B5CF6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔑 Reset Your Password</h1>
        </div>
        <div class="content">
          <h2>Hi ${options.name},</h2>
          <p>We received a request to reset your Tribal Mingle password.</p>
          
          <div style="text-align: center;">
            <a href="${options.resetUrl}" class="button">Reset Password</a>
          </div>

          <p>This link will expire in 1 hour.</p>
          
          <p><strong>Didn't request this?</strong> If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
          
          <p>For security reasons, never share this link with anyone.</p>
          
          <p>Best regards,<br>The Tribal Mingle Team</p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Tribal Mingle. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `

  const text = `
Hi ${options.name},

We received a request to reset your Tribal Mingle password.

Reset your password: ${options.resetUrl}

This link will expire in 1 hour.

Didn't request this? If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.

For security reasons, never share this link with anyone.

Best regards,
The Tribal Mingle Team
  `

  return sendEmailViaResend({
    to: options.to,
    subject: '🔑 Reset Your Tribal Mingle Password',
    html,
    text,
  })
}

/**
 * Send registration reminder email (10 minutes after incomplete signup)
 */
export async function sendRegistrationReminderEmail(options: SendRegistrationReminderEmailOptions) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; background: #8B5CF6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .highlight { background: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>⏰ Complete Your Tribal Mingle Registration</h1>
        </div>
        <div class="content">
          <h2>Hi ${options.name},</h2>
          <p>We noticed you started creating your Tribal Mingle account but didn't finish. Don't miss out on connecting with amazing African singles!</p>
          
          <div class="highlight">
            <strong>🎯 You're almost there!</strong>
            <p>Complete your profile to start matching with compatible partners in our exclusive community.</p>
          </div>

          <p><strong>What you'll get:</strong></p>
          <ul>
            <li>✨ Access to verified, quality profiles</li>
            <li>💝 AI-powered compatibility matching</li>
            <li>🌍 Connect with African singles worldwide</li>
            <li>🎉 Join exclusive community events</li>
          </ul>

          <div style="text-align: center;">
            <a href="${options.continueUrl}" class="button">Continue Registration</a>
          </div>

          <p>Your account is waiting – it only takes a few more minutes to complete!</p>
          
          <p>Best regards,<br>The Tribal Mingle Team</p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Tribal Mingle. All rights reserved.</p>
          <p>This is a one-time reminder. You can complete your registration anytime.</p>
        </div>
      </div>
    </body>
    </html>
  `

  const text = `
Hi ${options.name},

We noticed you started creating your Tribal Mingle account but didn't finish. Don't miss out on connecting with amazing African singles!

You're almost there! Complete your profile to start matching with compatible partners in our exclusive community.

What you'll get:
- Access to verified, quality profiles
- AI-powered compatibility matching
- Connect with African singles worldwide
- Join exclusive community events

Continue your registration: ${options.continueUrl}

Your account is waiting – it only takes a few more minutes to complete!

Best regards,
The Tribal Mingle Team

---
This is a one-time reminder. You can complete your registration anytime.
  `

  return sendEmailViaResend({
    to: options.to,
    subject: '⏰ Complete Your Tribal Mingle Registration',
    html,
    text,
  })
}
