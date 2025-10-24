# TripMan Test Plan

## Overview
This document outlines the testing strategy for the TripMan scheduling microsite.

## Test Categories

### 1. Unit Tests ✅
- **ICS Generation**: ✅ Complete (100% coverage)
- **Calendar Utilities**: ✅ Complete (36.73% coverage)
- **Authentication**: ⚠️ Skipped (Next.js dependencies)

### 2. Integration Tests
- **Database Operations**: Prisma schema, migrations, seeding
- **API Routes**: Event types, availability, booking, webhooks
- **Email Functionality**: Resend integration

### 3. End-to-End Tests
- **User Journey**: Event selection → Scheduling → Booking → Confirmation
- **Admin Panel**: Authentication, booking management
- **Responsive Design**: Mobile-first experience

### 4. Performance Tests
- **Lighthouse**: Performance, Best Practices, SEO, Accessibility
- **Load Testing**: API endpoints under load

## Test Scenarios

### Frontend User Journey
1. **Landing Page**
   - [ ] Hero section displays correctly
   - [ ] Event cards are visible and clickable
   - [ ] Smooth scrolling to sections
   - [ ] Mobile responsiveness

2. **Event Selection**
   - [ ] Event cards show correct information
   - [ ] Clicking event card scrolls to scheduler
   - [ ] Selected event is highlighted
   - [ ] GA4 tracking fires on selection

3. **Scheduling (Embed Mode)**
   - [ ] Cal.com/Calendly embed loads correctly
   - [ ] Event type is pre-selected
   - [ ] Booking completion triggers confirmation
   - [ ] Webhook receives booking data

4. **Scheduling (Custom Mode)**
   - [ ] Calendar displays available dates
   - [ ] Time slots are calculated correctly
   - [ ] Busy times are disabled
   - [ ] Date selection shows available times

5. **Booking Form**
   - [ ] Form validation works
   - [ ] Required fields are enforced
   - [ ] Timezone auto-detection
   - [ ] Terms checkbox required

6. **Confirmation**
   - [ ] Booking details displayed correctly
   - [ ] ICS download works
   - [ ] WhatsApp contact link
   - [ ] Email confirmation sent

### Admin Panel
1. **Authentication**
   - [ ] Basic auth required
   - [ ] Invalid credentials rejected
   - [ ] Session management

2. **Booking Management**
   - [ ] All bookings visible
   - [ ] Filtering by status/date
   - [ ] Booking details view
   - [ ] Status updates (confirm/cancel)
   - [ ] Email notifications sent

### API Endpoints
1. **Event Types** (`/api/event-types`)
   - [ ] Returns active event types
   - [ ] Proper error handling

2. **Availability** (`/api/availability`)
   - [ ] Calculates available slots
   - [ ] Respects working hours
   - [ ] Handles busy times
   - [ ] Buffer time consideration

3. **Booking** (`/api/booking`)
   - [ ] Validates input data
   - [ ] Creates database record
   - [ ] Sends confirmation emails
   - [ ] Creates Google Calendar event (custom mode)

4. **Webhooks** (`/api/webhooks/cal`)
   - [ ] Verifies webhook signature
   - [ ] Processes booking events
   - [ ] Updates database
   - [ ] Sends notifications

### Database
1. **Schema**
   - [ ] All tables created correctly
   - [ ] Relationships work
   - [ ] Indexes for performance

2. **Seeding**
   - [ ] Default event types created
   - [ ] Admin user created (if env vars set)

3. **Migrations**
   - [ ] Schema changes applied
   - [ ] Data integrity maintained

### Email System
1. **Resend Integration**
   - [ ] Booking confirmations sent
   - [ ] Admin notifications sent
   - [ ] ICS attachments included
   - [ ] Proper templates used

### SEO & Analytics
1. **Metadata**
   - [ ] Page titles and descriptions
   - [ ] Open Graph tags
   - [ ] Twitter cards
   - [ ] Structured data

2. **Analytics**
   - [ ] GA4 tracking enabled
   - [ ] Events tracked correctly
   - [ ] Page views recorded

3. **Performance**
   - [ ] Lighthouse score ≥ 90
   - [ ] Fast loading times
   - [ ] Optimized images

## Test Environment Setup

### Prerequisites
- Node.js 18+
- PostgreSQL/Neon database
- Environment variables configured
- Resend API key
- Google Calendar credentials (custom mode)

### Test Data
- 4 default event types
- Admin user credentials
- Sample booking data

## Manual Testing Checklist

### Desktop Testing
- [ ] Chrome, Firefox, Safari
- [ ] Different screen sizes
- [ ] Form interactions
- [ ] Navigation

### Mobile Testing
- [ ] iOS Safari
- [ ] Android Chrome
- [ ] Touch interactions
- [ ] Responsive layout

### Accessibility Testing
- [ ] Keyboard navigation
- [ ] Screen reader compatibility
- [ ] Color contrast
- [ ] Focus indicators

## Performance Benchmarks
- **First Contentful Paint**: < 1.5s
- **Largest Contentful Paint**: < 2.5s
- **Cumulative Layout Shift**: < 0.1
- **First Input Delay**: < 100ms

## Security Testing
- [ ] Input validation
- [ ] SQL injection prevention
- [ ] XSS protection
- [ ] CSRF protection
- [ ] Authentication security

## Deployment Testing
- [ ] Vercel deployment
- [ ] Environment variables
- [ ] Database connection
- [ ] Email functionality
- [ ] Analytics tracking

## Post-Deployment Verification
- [ ] OG image generation
- [ ] Sitemap accessibility
- [ ] Robots.txt configuration
- [ ] SSL certificate
- [ ] Domain configuration

## Bug Reporting
- [ ] Clear reproduction steps
- [ ] Expected vs actual behavior
- [ ] Browser/device information
- [ ] Console errors
- [ ] Network requests

## Success Criteria
- [ ] All critical user journeys work
- [ ] Admin panel functional
- [ ] Emails sent successfully
- [ ] Database operations reliable
- [ ] Performance benchmarks met
- [ ] Security requirements satisfied
- [ ] Accessibility standards met
