# The TripMan - Premium Transportation & Experience Services

A production-ready scheduling microsite for The TripMan, built with Next.js 15, TypeScript, Tailwind CSS, and shadcn/ui. This application provides a seamless booking experience for premium transportation services.

## 🚀 Features

- **One-Page Scheduling Experience**: Hero section, event selection, calendar integration, and booking form
- **Dual Scheduling Modes**:
  - **Embed Mode**: Cal.com/Calendly integration with webhooks
  - **Custom Mode**: FullCalendar with Google Calendar integration
- **Email Notifications**: Automated booking confirmations with .ics attachments
- **Admin Dashboard**: Booking management with authentication
- **Mobile-First Design**: Responsive and accessible UI
- **SEO Optimized**: Dynamic OG images, sitemap, and meta tags
- **Analytics Integration**: GA4 tracking for booking events

## 🛠 Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **Database**: PostgreSQL (Neon) + Prisma ORM
- **Email**: Resend for transactional emails
- **Calendar**: FullCalendar + Google Calendar API
- **Authentication**: Cookie-based admin session (server-signed)
- **Analytics**: Google Analytics 4
- **Deployment**: Vercel

## 📋 Prerequisites

- Node.js 18+ and npm
- PostgreSQL database (Neon recommended)
- Resend account for emails
- Google Calendar API credentials (for custom mode)
- Cal.com or Calendly account (for embed mode)

## 🚀 Quick Start

### 1. Clone and Install

```bash
git clone <repository-url>
cd TheTripMan
npm install
```

### 2. Environment Setup

Copy the example environment file and configure your variables:

```bash
cp env.example .env.local
```

Fill in your environment variables (see [Environment Variables](#environment-variables) section).

### 3. Database Setup

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Seed the database with default event types
npm run db:seed
```

### 4. Development

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see your application.

## 🔧 Environment Variables

Create a `.env.local` file with the following variables:

### Required Variables

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/tripmandb"

# Email (Resend)
RESEND_API_KEY="re_xxxxxxxxxxxx"

# Site Configuration
NEXT_PUBLIC_SITE_URL="http://localhost:3000"

# Admin Authentication
ADMIN_EMAIL="admin@tripmansite.com"
ADMIN_PASSWORD="secure-password-here"

# Business Configuration
BUSINESS_TIMEZONE="America/Toronto"
SCHEDULER_MODE="embed" # embed | custom
BUFFER_MINUTES=15
BOOKING_MIN_NOTICE_HOURS=24
CANCEL_POLICY_HOURS=12
```

### Optional Variables

```env
# Analytics
GA4_ID="G-XXXXXXXXXX"

# Embed Mode Configuration
CAL_VENDOR="calcom" # calcom | calendly
CAL_EVENT_TYPE_SLUG="tripman/birthday-ride"
CAL_WEBHOOK_SECRET="your-webhook-secret"

# Custom Mode Configuration (Google Calendar)
GOOGLE_CALENDAR_ID="your-calendar-id@group.calendar.google.com"
GOOGLE_CLIENT_EMAIL="your-service-account@project.iam.gserviceaccount.com"
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----\n"

# SEO
GOOGLE_SITE_VERIFICATION="your-verification-code"
```

## 🗄 Database Schema

The application uses the following Prisma schema:

- **EventType**: Service offerings (birthday rides, airport pickups, etc.)
- **Booking**: Customer bookings with all details
- **AdminUser**: Admin authentication

### Default Event Types

The seed scripts create **3 packages**:

- The Tripman Experience (60m, from $200; tiered by group size)
- The Tripman Experience + (60m, from $500; tiered by group size)
- The Tripman Promo Ride (60m, custom pricing)

## 📱 Scheduling Modes

### Embed Mode (Default)

Uses Cal.com or Calendly for scheduling:

- Configure `CAL_VENDOR` and `CAL_EVENT_TYPE_SLUG`
- Set up webhooks pointing to `/api/webhooks/cal`
- Bookings are automatically synced to your database

### Custom Mode

Uses FullCalendar with Google Calendar integration:

- Configure Google Calendar API credentials
- Set `SCHEDULER_MODE=custom`
- Full control over availability and booking flow

## 📧 Email Configuration

The application sends automated emails using Resend:

1. **Booking Confirmations**: Sent to customers with .ics attachment
2. **Admin Notifications**: Sent to admin for new bookings
3. **Cancellation Notifications**: Sent when bookings are canceled

## 🔐 Admin Access

Visit `/admin` and log in using the `AdminUser` credentials created by the seed script.

## 🚀 Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Manual Deployment

```bash
npm run build
npm start
```

## 📊 Analytics

Google Analytics 4 integration tracks:

- Page views
- Event type selections
- Booking completions
- Calendar interactions

## 🧪 Testing

```bash
# Run tests
npm test

# Run e2e tests (if configured)
npm run test:e2e
```

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── admin/             # Admin dashboard
│   └── (og)/              # OG image generation
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── Hero.tsx          # Landing hero
│   ├── EventCards.tsx    # Service selection
│   ├── SchedulerSwitch.tsx # Scheduling mode
│   ├── BookingForm.tsx   # Booking form
│   ├── FAQ.tsx           # FAQ section
│   └── Footer.tsx        # Site footer
├── lib/                  # Utility libraries
│   ├── db.ts            # Prisma client
│   ├── email.ts         # Email utilities
│   ├── ics.ts           # Calendar file generation
│   ├── analytics.ts     # GA4 integration
│   ├── calendar.ts      # Google Calendar integration
│   └── admin-session.ts # Admin authentication
└── prisma/              # Database schema and migrations
```

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema to database
- `npm run db:seed` - Seed database with default data
- `npm run db:studio` - Open Prisma Studio

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:

- Email: thetripman01@gmail.com
- WhatsApp: Coming Soon
- Issues: Use GitHub issues

## 🔄 Updates

Stay updated with the latest features and improvements by:

- Following the repository
- Checking the changelog
- Subscribing to release notifications

---

Built with ❤️ for The TripMan
