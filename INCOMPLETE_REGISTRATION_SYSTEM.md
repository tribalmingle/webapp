# Incomplete Registration System

## Overview
The platform now tracks incomplete registrations to prevent abandoned signups and ensure email/phone numbers can't be reused.

## How It Works

### 1. Initial Signup (Name, Email, Password)
When a user creates an account with basic info:
- Account is created in `users` collection
- `registrationComplete: false` flag is set
- User receives welcome email
- Email is now **locked** - cannot be used for another registration

### 2. Existing User Login Behavior
When a user with incomplete registration logs in:
- System checks `registrationComplete` field
- If `false`, redirect to `/sign-up?step=continue` 
- If `true`, redirect to `/dashboard-spa`
- User continues from where they left off

### 3. Duplicate Prevention
The system prevents duplicate registrations:

**On Signup:**
- Checks `users` collection for existing email
- Checks `applicants` collection for existing email
- Returns error: "An account with this email already exists. Please log in instead."

**On Phone Verification:**
- Checks if phone number already exists in `users` collection
- Checks if phone number already exists in `applicants` collection
- Returns error: "This phone number is already registered."

### 4. Password Reset Flow
If user forgets password:
1. User enters email at `/forgot-password`
2. System sends reset link via email
3. User clicks link and enters new password
4. After reset, redirects based on `registrationComplete`:
   - Incomplete: `/sign-up?step=continue`
   - Complete: `/login`

### 5. Email/Phone Locking
Once used, email and phone numbers are **permanently locked**:
- Email locked on initial signup
- Phone locked on verification step
- Cannot be used again even if registration never completes
- Prevents spam/fake accounts

## API Endpoints

### POST /api/auth/signup
Creates initial account with `registrationComplete: false`

### POST /api/auth/signin  
Returns `redirectTo` field:
- `/dashboard-spa` if registration complete
- `/sign-up?step=continue` if incomplete

### POST /api/auth/forgot-password
Sends password reset email to registered users

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "If an account exists with this email, a password reset link has been sent."
}
```

### POST /api/auth/reset-password
Resets password using token from email

**Request:**
```json
{
  "token": "reset-token-from-email",
  "password": "newpassword123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password reset successful.",
  "redirectTo": "/sign-up?step=continue"
}
```

### POST /api/auth/complete-registration
Completes registration after phone verification

**Request:**
```json
{
  "phone": "+2348012345678",
  "tribe": "Igbo",
  "city": "Lagos",
  "country": "Nigeria",
  "bio": "Looking for meaningful connections",
  "interests": ["Travel", "Music"],
  "profilePhotos": ["url1", "url2"],
  "profilePhoto": "url1",
  "selfiePhoto": "url1"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Registration completed successfully",
  "redirectTo": "/dashboard-spa"
}
```

### GET /api/admin/incomplete-registrations
Admin endpoint to view users with incomplete registrations

**Query Parameters:**
- `page` (optional, default: 1)
- `limit` (optional, default: 20)

**Response:**
```json
{
  "success": true,
  "users": [
    {
      "_id": "...",
      "email": "user@example.com",
      "name": "John Doe",
      "age": 30,
      "gender": "male",
      "registrationComplete": false,
      "createdAt": "2025-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  }
}
```

## Database Schema Changes

### User Model
Added new fields:
```typescript
{
  phone?: string              // Phone number (locked after first use)
  registrationComplete: boolean  // True when all steps complete
  resetToken?: string         // Password reset token
  resetTokenExpiry?: Date     // Reset token expiration
}
```

## Frontend Integration

### Login Page
```typescript
const response = await fetch('/api/auth/signin', {
  method: 'POST',
  body: JSON.stringify({ email, password })
})

const data = await response.json()

if (data.success) {
  // Redirect based on registration status
  router.push(data.redirectTo)
}
```

### Signup Flow
1. **Step 1**: Basic info (name, email, password)
   - Creates account with `registrationComplete: false`
   
2. **Step 2**: Phone verification
   - User receives code via SMS and email
   - Same code sent via both channels
   
3. **Step 3**: Profile completion
   - Calls `/api/auth/complete-registration`
   - Sets `registrationComplete: true`
   - User can now access full platform

### Forgot Password Page
```typescript
const handleForgotPassword = async (email: string) => {
  const response = await fetch('/api/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email })
  })
  
  // Always shows success to prevent email enumeration
  showMessage('If an account exists, a reset link has been sent.')
}
```

### Reset Password Page
```typescript
const handleResetPassword = async (token: string, password: string) => {
  const response = await fetch('/api/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ token, password })
  })
  
  const data = await response.json()
  
  if (data.success) {
    router.push(data.redirectTo) // Continues registration if incomplete
  }
}
```

## Admin Dashboard

Admins can view incomplete registrations:
- See users stuck in registration
- Monitor abandonment rates
- Identify patterns in drop-offs
- Send reminder emails (future feature)

## Security Features

1. **Email Enumeration Prevention**: Password reset always returns success
2. **Token Expiration**: Reset tokens expire after 1 hour
3. **Phone Locking**: Prevents phone number reuse across accounts
4. **Email Locking**: Prevents email reuse even for incomplete accounts
5. **Secure Tokens**: Crypto-random reset tokens (32 bytes)

## User Experience

### Success Case
1. User signs up → Creates account
2. User verifies phone → Gets SMS + Email with same code
3. User completes profile → Full access to platform

### Abandoned Registration Case
1. User signs up → Creates account
2. User closes browser → Email + password saved
3. User returns days later → Logs in
4. System detects incomplete → Redirects to continue registration
5. User completes flow → Full access

### Forgot Password Case
1. User with incomplete registration forgets password
2. User requests reset link via email
3. User creates new password
4. System redirects to continue registration (not dashboard)
5. User completes flow → Full access

## Testing Checklist

- [ ] Can create account with name, email, password
- [ ] New account has `registrationComplete: false`
- [ ] Login with incomplete account redirects to continue registration
- [ ] Cannot signup with same email twice
- [ ] Cannot verify with same phone number twice
- [ ] Password reset email received
- [ ] Reset link works and redirects correctly
- [ ] Completing registration sets `registrationComplete: true`
- [ ] After completion, login redirects to dashboard
- [ ] Admin can view incomplete registrations list
- [ ] Verification code same in SMS and email
- [ ] Email and phone permanently locked after use

## Future Enhancements

1. **Email Reminders**: Automated emails to incomplete registrations
2. **Analytics Dashboard**: Track registration funnel drop-offs
3. **Mobile App Support**: Deep linking for continue registration
4. **Social Login**: Complete social auth users get `registrationComplete: true`
5. **Account Cleanup**: Delete incomplete accounts after X days
