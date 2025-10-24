# TripMan Deployment Guide

## 🚀 Production Deployment

This guide will help you deploy The TripMan scheduling microsite to production.

## Prerequisites

- [Vercel](https://vercel.com) account
- [Neon](https://neon.tech) or PostgreSQL database
- [Resend](https://resend.com) account for emails
- [Google Calendar API](https://developers.google.com/calendar) (for custom mode)
- [Google Analytics 4](https://analytics.google.com/) (optional)

## Step 1: Database Setup

### Option A: Neon (Recommended)
1. Create a new project at [neon.tech](https://neon.tech)
2. Create a new database
3. Copy the connection string (it looks like: `postgresql://user:password@host/database`)

### Option B: PostgreSQL
1. Set up a PostgreSQL database
2. Note the connection details

## Step 2: Environment Variables

Create a `.env.local` file in your project root with the following variables:

```env
# Database
DATABASE_URL="your-database-connection-string"

# Email (Resend)
RESEND_API_KEY="re_xxxxxxxxxxxx"

# Site Configuration
NEXT_PUBLIC_SITE_URL="https://your-domain.com"
NEXT_PUBLIC_SCHEDULER_MODE="embed" # embed | custom

# Admin Authentication
ADMIN_EMAIL="admin@yourdomain.com"
ADMIN_PASSWORD="secure-password-here"

# Business Configuration
BUSINESS_TIMEZONE="America/Toronto"
BUFFER_MINUTES=15
BOOKING_MIN_NOTICE_HOURS=24
CANCEL_POLICY_HOURS=12

# Analytics
NEXT_PUBLIC_GA4_ID="G-XXXXXXXXXX"

# Embed Mode Configuration
CAL_VENDOR="calcom" # calcom | calendly
CAL_EVENT_TYPE_SLUG="your-calendar/event-type"
CAL_WEBHOOK_SECRET="your-webhook-secret"

# Custom Mode Configuration (Google Calendar)
GOOGLE_CALENDAR_ID="your-calendar-id@group.calendar.google.com"
GOOGLE_CLIENT_EMAIL="your-service-account@project.iam.gserviceaccount.com"
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----\n"

# SEO
GOOGLE_SITE_VERIFICATION="your-verification-code"
```

## Step 3: Vercel Deployment

### Option A: Vercel CLI
1. Install Vercel CLI: `npm i -g vercel`
2. Run: `vercel`
3. Follow the prompts to connect your repository
4. Set environment variables in the Vercel dashboard

### Option B: Vercel Dashboard
1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your Git repository
4. Configure environment variables
5. Deploy

## Step 4: Database Migration

After deployment, run the database migrations:

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Or run migrations
npm run db:migrate

# Seed the database
npm run db:seed
```

## Step 5: Configure External Services

### Resend (Email)
1. Create account at [resend.com](https://resend.com)
2. Add your domain
3. Get API key
4. Update `RESEND_API_KEY` in environment variables

### Google Calendar (Custom Mode)
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project
3. Enable Google Calendar API
4. Create a service account
5. Download the JSON key file
6. Add the calendar ID and credentials to environment variables

### Cal.com/Calendly (Embed Mode)
1. Set up your calendar integration
2. Configure webhook endpoint: `https://your-domain.com/api/webhooks/cal`
3. Update `CAL_EVENT_TYPE_SLUG` and `CAL_WEBHOOK_SECRET`

### Google Analytics 4
1. Create GA4 property
2. Get measurement ID (G-XXXXXXXXXX)
3. Add to `NEXT_PUBLIC_GA4_ID`

## Step 6: Post-Deployment Verification

### 1. Test Core Functionality
- [ ] Landing page loads correctly
- [ ] Event selection works
- [ ] Scheduling system functions
- [ ] Booking form submits
- [ ] Confirmation emails sent
- [ ] Admin panel accessible

### 2. Test Email System
- [ ] Booking confirmations sent
- [ ] Admin notifications received
- [ ] ICS attachments included

### 3. Test Admin Panel
- [ ] Basic auth works
- [ ] Bookings visible
- [ ] Status updates work
- [ ] Filtering functions

### 4. Test SEO & Analytics
- [ ] OG images generate
- [ ] Sitemap accessible
- [ ] GA4 tracking works
- [ ] Meta tags correct

## Step 7: Domain Configuration

### Custom Domain
1. Add custom domain in Vercel dashboard
2. Configure DNS records
3. Update `NEXT_PUBLIC_SITE_URL` in environment variables

### SSL Certificate
- Automatically handled by Vercel

## Step 8: Monitoring & Maintenance

### Performance Monitoring
- Use Vercel Analytics
- Monitor Core Web Vitals
- Check Lighthouse scores

### Error Monitoring
- Set up error tracking (Sentry, LogRocket)
- Monitor API response times
- Check database performance

### Regular Maintenance
- Keep dependencies updated
- Monitor database size
- Review and rotate API keys
- Backup database regularly

## Troubleshooting

### Common Issues

#### Database Connection
```bash
# Check connection
npx prisma db pull

# Reset database
npx prisma db push --force-reset
```

#### Email Issues
- Verify Resend API key
- Check domain verification
- Review email templates

#### Calendar Integration
- Verify Google Calendar permissions
- Check service account credentials
- Test webhook endpoints

#### Build Errors
- Check environment variables
- Verify TypeScript compilation
- Review ESLint warnings

### Support

For issues:
1. Check Vercel deployment logs
2. Review application logs
3. Test locally with production environment
4. Contact support with error details

## Security Checklist

- [ ] Environment variables secured
- [ ] Database connection encrypted
- [ ] API keys rotated regularly
- [ ] Admin credentials strong
- [ ] HTTPS enforced
- [ ] CORS configured
- [ ] Rate limiting implemented
- [ ] Input validation active

## Performance Optimization

- [ ] Images optimized
- [ ] Code splitting implemented
- [ ] Caching configured
- [ ] Database queries optimized
- [ ] CDN enabled
- [ ] Compression active

## Backup Strategy

- [ ] Database backups automated
- [ ] Code version controlled
- [ ] Environment variables backed up
- [ ] Recovery plan documented

## Success Metrics

Track these metrics post-deployment:
- Page load times
- Booking conversion rate
- Email delivery rate
- Admin panel usage
- Error rates
- User satisfaction

---

🎉 **Congratulations!** Your TripMan scheduling microsite is now live and ready to accept bookings!
