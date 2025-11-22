# Admin Access Instructions

## Admin Login

Access the admin dashboard at: **http://localhost:3000/admin/login**

### Admin Credentials:
- **Email:** profmendel@gmail.com
- **Password:** Gig@50chinedu

## Features

Once logged in, you'll have access to:

1. **Dashboard Overview** - Real-time statistics and KPIs
2. **User Management** - View, verify, suspend, ban, or delete users
3. **Revenue & Billing** - Track all financial transactions
4. **Reports & Moderation** - Review and resolve user reports
5. **Analytics & Insights** - Platform performance metrics
6. **Marketing & Growth** - Campaign management and conversion tracking
7. **📧 Email Users** - Send professional branded emails to members
8. **Platform Settings** - Configure features and security

## 📧 New: Email Functionality

The admin dashboard now includes a **world-class email system**:

### Features:
- ✉️ Send beautifully designed emails to any member
- 🎨 Professional template with Tribal Mingle branding
- 💜 Purple and orange gradient design
- 📱 Mobile-responsive email layout
- 👥 Select individual users or bulk send
- 🔍 Search users by name or email
- 👁️ Live preview of your email
- ✅ Real-time success/error feedback

### How to Use:
1. Navigate to **"Email Users"** in the admin sidebar
2. Compose your message (subject + content)
3. Select recipients (search, individual, or select all)
4. Preview your email in real-time
5. Click **"Send to X User(s)"**
6. Wait for confirmation

### Email Configuration:
To enable email sending, configure your email service in `.env.local`:

```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
```

📖 See **EMAIL_CONFIGURATION.md** for detailed setup instructions with Gmail, SendGrid, AWS SES, and Mailgun.

## Security

- Admin sessions are stored securely
- Password is hashed using bcrypt (salt rounds: 10)
- Session automatically expires when browser is closed
- All admin actions should be logged (recommended for production)

## Quick Links

- **Admin Login:** http://localhost:3000/admin/login
- **Admin Dashboard:** http://localhost:3000/admin
- **User Dashboard:** http://localhost:3000/dashboard-spa
- **User Login:** http://localhost:3000/login

---

**Note:** Keep these credentials secure. In production, implement proper admin role management and 2FA.
