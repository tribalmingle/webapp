import { NextRequest, NextResponse } from 'next/server'
import { getMongoDb } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import nodemailer from 'nodemailer'
import { ensureAdminRequest } from '@/lib/admin/auth'

export async function POST(request: NextRequest) {
  const auth = ensureAdminRequest(request, { roles: ['superadmin'] })
  if ('response' in auth) {
    return auth.response
  }

  try {
    const { userIds, subject, message } = await request.json()

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json({ success: false, message: 'No users selected' }, { status: 400 })
    }

    if (!subject || !message) {
      return NextResponse.json({ success: false, message: 'Subject and message are required' }, { status: 400 })
    }

    // Get users from database
    const db = await getMongoDb()
    const users = await db.collection('users')
      .find({ _id: { $in: userIds.map(id => new ObjectId(id)) } })
      .project({ email: 1, name: 1 })
      .toArray()

    if (users.length === 0) {
      return NextResponse.json({ success: false, message: 'No valid users found' }, { status: 404 })
    }

    // Create email transporter
    // NOTE: Configure your email service here (Gmail, SendGrid, AWS SES, etc.)
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    })

    // Send emails to all selected users
    let sentCount = 0
    const emailPromises = users.map(async (user) => {
      try {
        const emailHtml = generateEmailTemplate(user.name, subject, message)
        
        await transporter.sendMail({
          from: `"Tribal Mingle" <${process.env.EMAIL_USER || 'noreply@tribalmingle.com'}>`,
          to: user.email,
          subject: subject,
          html: emailHtml,
          text: message, // Plain text fallback
        })
        
        sentCount++
      } catch (error) {
        console.error(`Failed to send email to ${user.email}:`, error)
      }
    })

    await Promise.all(emailPromises)

    return NextResponse.json({ 
      success: true, 
      message: `Email sent to ${sentCount} user(s)`,
      sentCount 
    })

  } catch (error) {
    console.error('Error sending emails:', error)
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to send emails' 
    }, { status: 500 })
  }
}

// World-class email template
function generateEmailTemplate(userName: string, subject: string, message: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333333;
      background-color: #f5f5f5;
    }
    .email-wrapper {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
    }
    .email-header {
      background: #7c3aed;
      padding: 40px 30px;
      text-align: center;
    }
    .logo-container {
      display: inline-block;
      background-color: #7c3aed;
      padding: 15px;
      border-radius: 50%;
      margin-bottom: 15px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    .logo {
      width: 60px;
      height: 60px;
      display: block;
    }
    .brand-name {
      font-size: 28px;
      font-weight: bold;
      color: #ffffff;
      margin-top: 10px;
      letter-spacing: 0.5px;
    }
    .email-content {
      padding: 40px 30px;
    }
    .greeting {
      font-size: 20px;
      font-weight: 600;
      color: #1f2937;
      margin-bottom: 20px;
    }
    .subject-line {
      font-size: 24px;
      font-weight: bold;
      color: #7c3aed;
      margin-bottom: 25px;
      padding-bottom: 15px;
      border-bottom: 3px solid #f97316;
    }
    .message-body {
      font-size: 16px;
      color: #4b5563;
      line-height: 1.8;
      margin-bottom: 30px;
      white-space: pre-wrap;
    }
    .cta-button {
      display: inline-block;
      background: linear-gradient(135deg, #7c3aed 0%, #c026d3 100%);
      color: #ffffff;
      text-decoration: none;
      padding: 14px 32px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 16px;
      margin: 20px 0;
      box-shadow: 0 4px 6px rgba(124, 58, 237, 0.3);
      transition: transform 0.2s;
    }
    .cta-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 12px rgba(124, 58, 237, 0.4);
    }
    .divider {
      height: 1px;
      background: linear-gradient(to right, transparent, #e5e7eb, transparent);
      margin: 30px 0;
    }
    .footer {
      background-color: #f9fafb;
      padding: 30px;
      text-align: center;
      border-top: 3px solid #7c3aed;
    }
    .footer-content {
      font-size: 14px;
      color: #6b7280;
      margin-bottom: 15px;
    }
    .social-links {
      margin: 20px 0;
    }
    .social-link {
      display: inline-block;
      margin: 0 10px;
      color: #7c3aed;
      text-decoration: none;
      font-weight: 600;
    }
    .footer-legal {
      font-size: 12px;
      color: #9ca3af;
      margin-top: 20px;
      line-height: 1.5;
    }
    .highlight-box {
      background: linear-gradient(135deg, #fef3c7 0%, #fed7aa 100%);
      border-left: 4px solid #f97316;
      padding: 20px;
      border-radius: 8px;
      margin: 25px 0;
    }
    .highlight-box p {
      color: #78350f;
      font-weight: 500;
      margin: 0;
    }
    @media only screen and (max-width: 600px) {
      .email-header {
        padding: 30px 20px;
      }
      .email-content {
        padding: 30px 20px;
      }
      .subject-line {
        font-size: 20px;
      }
      .brand-name {
        font-size: 24px;
      }
    }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <!-- Header with Branding -->
    <div class="email-header">
      <div class="logo-container">
        <svg class="logo" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" fill="#7c3aed"/>
        </svg>
      </div>
      <div class="brand-name">Tribal Mingle</div>
    </div>

    <!-- Main Content -->
    <div class="email-content">
      <div class="greeting">Hello ${userName},</div>
      
      <div class="subject-line">${subject}</div>
      
      <div class="message-body">${message}</div>

      <div class="highlight-box">
        <p>💜 This message was sent to you by the Tribal Mingle team because you're a valued member of our community.</p>
      </div>

      <a href="https://tribalmingle.com/dashboard-spa" class="cta-button">
        Visit Your Dashboard →
      </a>

      <div class="divider"></div>

      <p style="color: #6b7280; font-size: 14px;">
        Need help? Our support team is always here for you. Reply to this email or visit our help center.
      </p>
    </div>

    <!-- Footer -->
    <div class="footer">
      <div class="footer-content">
        <strong>Tribal Mingle</strong><br>
        Connecting Hearts, Celebrating Culture
      </div>

      <div class="social-links">
        <a href="https://tribalmingle.com" class="social-link">Website</a>
        <span style="color: #d1d5db;">•</span>
        <a href="https://tribalmingle.com/help" class="social-link">Help Center</a>
        <span style="color: #d1d5db;">•</span>
        <a href="https://tribalmingle.com/contact" class="social-link">Contact Us</a>
      </div>

      <div class="footer-legal">
        © ${new Date().getFullYear()} Tribal Mingle. All rights reserved.<br>
        You're receiving this email because you're a member of Tribal Mingle.<br>
        <a href="https://tribalmingle.com/privacy" style="color: #7c3aed; text-decoration: none;">Privacy Policy</a> • 
        <a href="https://tribalmingle.com/terms" style="color: #7c3aed; text-decoration: none;">Terms of Service</a> • 
        <a href="https://tribalmingle.com/unsubscribe" style="color: #7c3aed; text-decoration: none;">Unsubscribe</a>
      </div>
    </div>
  </div>
</body>
</html>
  `
}
