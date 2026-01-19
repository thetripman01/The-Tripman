# Setup Checklist (Neon + Stripe + Resend)

Use this checklist to track progress while you connect real services and deploy.

## Phase 1: Accounts

- [ ] Neon project created, `DATABASE_URL` saved
- [ ] Stripe account created, API keys saved, webhook created + `STRIPE_WEBHOOK_SECRET` saved
- [ ] Resend account created, `RESEND_API_KEY` saved (domain verification optional but recommended)

## Phase 2: Environment variables (Vercel)

### Required

- [ ] `DATABASE_URL`
- [ ] `STRIPE_SECRET_KEY`
- [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- [ ] `STRIPE_WEBHOOK_SECRET`
- [ ] `RESEND_API_KEY`
- [ ] `NEXT_PUBLIC_SITE_URL`
- [ ] `NEXT_PUBLIC_SCHEDULER_MODE`
- [ ] `SCHEDULER_MODE`
- [ ] `ADMIN_SESSION_SECRET`
- [ ] `ADMIN_EMAIL` (seed-time)
- [ ] `ADMIN_PASSWORD` (seed-time)
- [ ] `BUSINESS_TIMEZONE`
- [ ] `BUFFER_MINUTES`
- [ ] `BOOKING_MIN_NOTICE_HOURS`
- [ ] `CANCEL_POLICY_HOURS`

### Optional

- [ ] `GOOGLE_CALENDAR_ID`
- [ ] `GOOGLE_CLIENT_EMAIL`
- [ ] `GOOGLE_PRIVATE_KEY`
- [ ] `NEXT_PUBLIC_GA4_ID`

## Phase 3: Database

- [ ] `npm run db:generate`
- [ ] `npm run db:push`
- [ ] `npm run db:seed:production`
- [ ] Verify in Neon: `EventType` has **3 packages only** and others are inactive

## Phase 4: Test

- [ ] Landing page renders
- [ ] Booking creates a record in DB
- [ ] Email sends (Resend logs)
- [ ] Admin login works (`/admin`)
- [ ] Stripe test payment works + webhook fires
