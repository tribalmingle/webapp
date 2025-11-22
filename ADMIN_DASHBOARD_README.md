# Tribal Mingle - Admin Dashboard

## Overview
World-class admin dashboard for managing the Tribal Mingle dating platform. Built with Next.js 14, TypeScript, and MongoDB.

## Access
Navigate to `/admin` to access the admin dashboard.

## Features

### 1. Dashboard Overview
- Real-time statistics and KPIs
- User growth metrics
- Revenue tracking
- Active user monitoring
- Pending verifications and reports
- Subscription breakdown analytics
- Platform activity metrics

### 2. User Management
- View all registered users
- Search and filter capabilities
- User verification system
- Suspend/ban user accounts
- Delete user profiles
- View user activity (matches, messages, reports)
- Export user data

### 3. Revenue & Billing
- Track all transactions
- Monthly revenue reports
- Total revenue analytics
- Premium user statistics
- Transaction history
- Export financial data

### 4. Reports & Moderation
- Review user-reported content
- Flag management system
- Quick action buttons (resolve/dismiss)
- Detailed report descriptions
- Reporter and reported user tracking

### 5. Analytics & Insights
- User growth charts
- Revenue trends
- Engagement metrics
  - Average session duration
  - Daily active users percentage
  - Match rate
  - Response rate
- Conversion funnel tracking

### 6. Marketing & Growth
- Email campaign management
- Push notification system
- Promotion tracking
- Referral program analytics
- Social media integration
- Conversion funnel visualization
  - Visitors → Sign ups → Profile completion → First match → Premium upgrade

### 7. Platform Settings
- General platform configuration
- Feature toggles
  - User registrations
  - Email verifications
  - Profile matching
  - In-app messaging
  - Video calls
  - Maintenance mode
- Security settings
- Audit logs

## API Endpoints

### Statistics
- `GET /api/admin/stats` - Fetch platform statistics

### User Management
- `GET /api/admin/users` - Get all users
- `POST /api/admin/user-action` - Perform user actions (verify, suspend, ban, delete)

### Financial
- `GET /api/admin/transactions` - Get all transactions

### Reports
- `GET /api/admin/reports` - Get all reports
- `POST /api/admin/report-action` - Resolve or dismiss reports

## Key Metrics Tracked

### User Metrics
- Total registered users
- Active users (last 7 days)
- New users today
- Premium vs Free users breakdown
- Verified user count
- Pending verification queue

### Financial Metrics
- Total revenue
- Monthly recurring revenue
- Premium subscriber count
- Transaction success rate

### Engagement Metrics
- Total matches made
- Total messages sent
- Average session duration
- Daily active user percentage
- Match rate
- Response rate

### Moderation Metrics
- Reported profiles
- Banned users
- Pending reports
- Resolved reports

## Design Philosophy

The admin dashboard is built with:

1. **Marketing Focus**: Every metric and feature is designed to help grow the platform and increase conversions
2. **User Safety**: Robust moderation tools to maintain a safe community
3. **Data-Driven Decisions**: Comprehensive analytics to inform business strategy
4. **Revenue Optimization**: Clear visibility into subscription metrics and revenue trends
5. **Operational Efficiency**: Quick access to common admin tasks

## Color Coding

- **Blue**: General metrics and information
- **Green**: Success states, revenue, verified users
- **Purple**: Premium features, subscriptions
- **Yellow**: Warning states, pending items
- **Red**: Critical issues, banned users, failed transactions
- **Orange**: Premium tiers, special promotions

## Responsive Design

The dashboard is fully responsive and works across:
- Desktop (1920px+)
- Laptop (1366px - 1919px)
- Tablet (768px - 1365px)
- Mobile (320px - 767px)

## Security Considerations

- Admin routes should be protected with authentication middleware
- Role-based access control (RBAC) recommended
- Audit logging for all admin actions
- Data export capabilities for compliance
- Secure handling of user PII

## Future Enhancements

1. Real-time websocket updates
2. Advanced charting with Chart.js or Recharts
3. Email template management
4. Push notification composer
5. A/B testing framework
6. Customer support ticketing
7. Content management system
8. Payment gateway integration
9. Automated fraud detection
10. Machine learning insights

## Technical Stack

- **Frontend**: Next.js 14, React 19, TypeScript
- **Styling**: Tailwind CSS 4
- **Database**: MongoDB
- **Icons**: Lucide React
- **State Management**: React Hooks

## Performance Optimizations

- Server-side data fetching
- Pagination for large datasets
- Lazy loading for heavy components
- Optimized MongoDB queries with indexes
- Caching strategies for frequently accessed data

---

Built with ❤️ for premium dating platform management
