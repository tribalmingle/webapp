# Email Configuration Guide

## Setup Instructions for Admin Email Functionality

The admin dashboard includes a powerful email system that allows you to send professional, branded emails to any member. Here's how to set it up:

### 1. Environment Variables

Create or update your `.env.local` file with the following email configuration:

```env
# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
```

### 2. Email Service Options

You can use any of these popular email services:

#### **Option A: Gmail (Recommended for Testing)**

1. Go to your Google Account settings
2. Enable 2-Factor Authentication
3. Generate an App Password:
   - Visit: https://myaccount.google.com/apppasswords
   - Select "Mail" and your device
   - Copy the 16-character password
4. Use these settings:
   ```env
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_SECURE=false
   EMAIL_USER=your-gmail@gmail.com
   EMAIL_PASSWORD=your-16-char-app-password
   ```

#### **Option B: SendGrid (Recommended for Production)**

1. Sign up at https://sendgrid.com
2. Create an API key
3. Use these settings:
   ```env
   EMAIL_HOST=smtp.sendgrid.net
   EMAIL_PORT=587
   EMAIL_SECURE=false
   EMAIL_USER=apikey
   EMAIL_PASSWORD=your-sendgrid-api-key
   ```

#### **Option C: AWS SES (Enterprise)**

1. Set up AWS SES in your AWS Console
2. Verify your domain
3. Create SMTP credentials
4. Use these settings:
   ```env
   EMAIL_HOST=email-smtp.us-east-1.amazonaws.com
   EMAIL_PORT=587
   EMAIL_SECURE=false
   EMAIL_USER=your-ses-smtp-username
   EMAIL_PASSWORD=your-ses-smtp-password
   ```

#### **Option D: Mailgun**

1. Sign up at https://mailgun.com
2. Get your SMTP credentials
3. Use these settings:
   ```env
   EMAIL_HOST=smtp.mailgun.org
   EMAIL_PORT=587
   EMAIL_SECURE=false
   EMAIL_USER=postmaster@your-domain.mailgun.org
   EMAIL_PASSWORD=your-mailgun-password
   ```

### 3. Email Template Features

The world-class email template includes:

✅ **Professional Design**
- Purple and orange gradient header matching Tribal Mingle branding
- Responsive layout that works on all devices
- Beautiful typography and spacing
- Professional footer with links

✅ **Branding Elements**
- Tribal Mingle logo (heart icon)
- Brand colors (purple #7c3aed, orange #f97316)
- Consistent visual identity

✅ **Content Features**
- Personalized greeting with user's name
- Custom subject line
- Admin's custom message (beautifully formatted)
- Call-to-action button to dashboard
- Social links and help center access
- Legal footer with privacy policy links

✅ **Technical Features**
- HTML email with plain text fallback
- Mobile-responsive design
- Professional email headers
- Unsubscribe link (ready for implementation)

### 4. How to Use

1. **Access Admin Panel**
   - Login at: http://localhost:3000/admin/login
   - Credentials: profmendel@gmail.com / Gig@50chinedu

2. **Navigate to Email Users**
   - Click "Email Users" in the admin sidebar

3. **Compose Your Email**
   - Enter a subject line
   - Write your message
   - Preview shows how it will look

4. **Select Recipients**
   - Search for specific users
   - Select individual users or use "Select All"
   - See selected count in real-time

5. **Send Email**
   - Click "Send to X User(s)" button
   - Wait for confirmation
   - Success message shows how many emails were sent

### 5. Security & Best Practices

**Security:**
- Emails are sent through secure SMTP connection
- Environment variables keep credentials safe
- Rate limiting recommended for production
- User authentication required for admin access

**Best Practices:**
- Test with your own email first
- Keep messages professional and relevant
- Don't spam users
- Include clear subject lines
- Personalize messages when possible
- Monitor bounce rates
- Implement unsubscribe functionality

**Email Deliverability:**
- Use verified sender email addresses
- Set up SPF, DKIM, and DMARC records
- Monitor sender reputation
- Avoid spam trigger words
- Keep email list clean

### 6. Example Use Cases

**Welcome Email**
```
Subject: Welcome to Tribal Mingle! 🎉
Message: We're thrilled to have you join our community! Your profile is now live and you can start connecting with amazing people who share your cultural values...
```

**Premium Feature Announcement**
```
Subject: New Premium Features Just for You
Message: Great news! We've just launched exciting new features for premium members, including video calling, advanced filters, and more...
```

**Event Notification**
```
Subject: Special Community Event This Weekend
Message: Join us for our virtual meetup this Saturday at 7 PM! Meet other members, share stories, and make new connections...
```

**Important Update**
```
Subject: Important Account Security Update
Message: We've enhanced our security features to keep your account even safer. Please review these changes...
```

### 7. Troubleshooting

**Emails not sending?**
- Check your environment variables are set correctly
- Verify email credentials are valid
- Check SMTP host and port settings
- Look at server console for error messages
- Test with a simple email first

**Emails going to spam?**
- Set up proper DNS records (SPF, DKIM, DMARC)
- Use a verified sender domain
- Warm up your sending IP address
- Keep content professional
- Include unsubscribe link

**Rate Limiting Issues?**
- Gmail: 500 emails/day for free accounts
- SendGrid: 100 emails/day on free tier
- Consider upgrading for higher volumes
- Implement queue system for bulk sends

### 8. Testing

Before sending to real users, test with:

```javascript
// Test recipients
const testEmails = [
  'your-test-email@gmail.com',
  'your-backup-email@gmail.com'
]
```

1. Send test email to yourself
2. Check inbox and spam folder
3. Verify formatting on desktop and mobile
4. Test all links in the email
5. Confirm unsubscribe link (when implemented)

### 9. Future Enhancements

Consider adding:
- Email scheduling (send later)
- Email templates library
- Merge tags (personalization)
- Email analytics (opens, clicks)
- A/B testing
- Automated campaigns
- User segmentation
- Email queue system
- Bounce handling
- Unsubscribe management

### 10. Support

For issues or questions:
- Check Next.js documentation: https://nextjs.org/docs
- Nodemailer docs: https://nodemailer.com/
- Check server logs for errors
- Test SMTP connection separately

---

## Quick Start Checklist

- [ ] Add EMAIL_* variables to .env.local
- [ ] Choose email service (Gmail/SendGrid/etc)
- [ ] Configure SMTP credentials
- [ ] Restart dev server
- [ ] Login to admin panel
- [ ] Navigate to Email Users
- [ ] Send test email to yourself
- [ ] Verify email received and looks good
- [ ] Start sending to real users!

---

**Note:** This is a production-ready email system. Make sure to comply with email marketing regulations (CAN-SPAM, GDPR, etc.) when sending bulk emails.
