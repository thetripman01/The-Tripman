# Environment Variables Setup Guide

## Overview

This guide shows you how to configure all environment variables in Vercel for your TripMan application.

## Step 1: Access Vercel Environment Variables

1. Go to https://vercel.com
2. Select your **TripMan project**
3. Go to **Settings** → **Environment Variables**
4. You'll see a list of existing variables (if any)

## Step 2: Add Required Variables

Click **"Add New"** for each variable below:

### Database Configuration

```env
Variable Name: DATABASE_URL
Value: postgresql://user:password@host/database?sslmode=require
Environment: Production, Preview, Development
```

**How to get**: From Neon Dashboard → Connection string

---

### Stripe Configuration

```env
Variable Name: STRIPE_SECRET_KEY
Value: sk_live_... (or sk_test_... for testing)
Environment: Production, Preview, Development
```

```env
Variable Name: NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
Value: pk_live_... (or pk_test_... for testing)
Environment: Production, Preview, Development
```

```env
Variable Name: STRIPE_WEBHOOK_SECRET
Value: whsec_...
Environment: Production, Preview
```

**How to get**: From Stripe Dashboard → Developers → API keys

---

### Email Configuration

```env
Variable Name: RESEND_API_KEY
Value: re_...
Environment: Production, Preview, Development
```

**How to get**: From Resend Dashboard → API Keys

---

### Site Configuration

```env
Variable Name: NEXT_PUBLIC_SITE_URL
Value: https://yourdomain.com
Environment: Production, Preview, Development
```

**Note**: Update this after domain is configured

```env
Variable Name: NEXT_PUBLIC_SCHEDULER_MODE
Value: custom
Environment: Production, Preview, Development
```

**Options**: `custom` or `embed`

```env
Variable Name: SCHEDULER_MODE
Value: custom
Environment: Production, Preview, Development
```

**Note**: Server-side scheduler mode. Keep in sync with `NEXT_PUBLIC_SCHEDULER_MODE`.

---

### Admin Configuration

TripMan uses a **cookie-based admin session**, so you must set a session signing secret.

```env
Variable Name: ADMIN_SESSION_SECRET
Value: generate-a-long-random-string
Environment: Production, Preview, Development
```

**Important**: This must remain stable. If you change it, all admin sessions are invalidated.

Admin email/password are **seed-time** credentials used to create/update the `AdminUser` row.

```env
Variable Name: ADMIN_EMAIL
Value: admin@yourdomain.com
Environment: Production, Preview, Development
```

```env
Variable Name: ADMIN_PASSWORD
Value: your-secure-password-here
Environment: Production, Preview, Development
```

**Security**: Use a strong password! Consider using a password manager.

---

### Business Configuration

```env
Variable Name: BUSINESS_TIMEZONE
Value: America/Toronto
Environment: Production, Preview, Development
```

**Note**: Change to your business timezone

```env
Variable Name: BUFFER_MINUTES
Value: 15
Environment: Production, Preview, Development
```

**Note**: Time between bookings (in minutes)

```env
Variable Name: BOOKING_MIN_NOTICE_HOURS
Value: 24
Environment: Production, Preview, Development
```

**Note**: Minimum hours in advance for booking

```env
Variable Name: CANCEL_POLICY_HOURS
Value: 12
Environment: Production, Preview, Development
```

**Note**: Hours before booking for free cancellation

---

## Step 3: Optional Variables

### Google Calendar (If Using Custom Scheduler)

```env
Variable Name: GOOGLE_CALENDAR_ID
Value: your-calendar@group.calendar.google.com
Environment: Production, Preview
```

```env
Variable Name: GOOGLE_CLIENT_EMAIL
Value: service-account@project.iam.gserviceaccount.com
Environment: Production, Preview
```

```env
Variable Name: GOOGLE_PRIVATE_KEY
Value: -----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n
Environment: Production, Preview
```

**Note**: Keep newlines as `\n` in the private key

---

### Analytics (Optional)

```env
Variable Name: NEXT_PUBLIC_GA4_ID
Value: G-XXXXXXXXXX
Environment: Production, Preview
```

**How to get**: From Google Analytics 4

---

### SEO (Optional)

```env
Variable Name: GOOGLE_SITE_VERIFICATION
Value: your-verification-code
Environment: Production
```

**How to get**: From Google Search Console

---

### Instagram Integration (Optional)

```env
Variable Name: IG_USER_ID
Value: your-instagram-user-id
Environment: Production, Preview
```

```env
Variable Name: IG_USER_TOKEN
Value: your-instagram-token
Environment: Production, Preview
```

```env
Variable Name: FB_APP_ID
Value: your-facebook-app-id
Environment: Production, Preview
```

```env
Variable Name: FB_APP_SECRET
Value: your-facebook-app-secret
Environment: Production, Preview
```

---

## Step 4: Environment-Specific Configuration

### Production Environment

- Use **live** Stripe keys (`sk_live_`, `pk_live_`)
- Use production domain in `NEXT_PUBLIC_SITE_URL`
- Use production database URL
- Use verified domain for emails

### Preview Environment

- Can use **test** Stripe keys for testing
- Use preview URL or production domain
- Can use same database or separate test database
- Test email configuration

### Development Environment

- Use **test** Stripe keys
- Use `http://localhost:3000` for `NEXT_PUBLIC_SITE_URL`
- Use local or test database
- Test email configuration

## Step 5: Verify Variables

After adding all variables:

1. **Check all are added**: Review the list
2. **Verify values**: Double-check critical values
3. **Check environments**: Ensure variables are in correct environments

## Step 6: Redeploy Application

1. Go to **Deployments** tab
2. Click **"Redeploy"** on latest deployment
3. Or push a new commit to trigger deployment
4. Wait for deployment to complete
5. Check deployment logs for any errors

## Step 7: Test Configuration

### Test Database Connection

- Make a test booking
- Check if data is saved to database
- Verify in Neon Dashboard

### Test Stripe

- Make a test payment
- Check Stripe Dashboard for transaction
- Verify webhook is received

### Test Email

- Make a test booking
- Check email is received
- Verify email formatting
- Check Resend Dashboard logs

### Test Admin Panel

- Visit `/admin`
- Try logging in
- Verify authentication works

## Security Best Practices

### ✅ DO:

- Store all secrets in Vercel environment variables
- Use different keys for test/production
- Rotate keys periodically
- Use strong admin passwords
- Never commit secrets to Git
- Review variable access regularly

### ❌ DON'T:

- Commit `.env` files to Git
- Share API keys publicly
- Use production keys in development
- Use weak admin passwords
- Store secrets in code
- Expose secrets in client-side code

## Troubleshooting

### Variables Not Working

- Check variable names match exactly (case-sensitive)
- Verify environment is correct (Production/Preview/Development)
- Redeploy after adding variables
- Check deployment logs for errors

### Build Fails

- Verify all required variables are set
- Check for typos in variable names
- Ensure values are correct format
- Review build logs for specific errors

### Runtime Errors

- Check variables are accessible in runtime
- Verify `NEXT_PUBLIC_` prefix for client-side variables
- Check server-side variables are not exposed to client
- Review application logs

## Variable Reference Checklist

Use this checklist to ensure all variables are set:

### Required Variables

- [ ] `DATABASE_URL`
- [ ] `STRIPE_SECRET_KEY`
- [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- [ ] `STRIPE_WEBHOOK_SECRET`
- [ ] `RESEND_API_KEY`
- [ ] `NEXT_PUBLIC_SITE_URL`
- [ ] `NEXT_PUBLIC_SCHEDULER_MODE`
- [ ] `SCHEDULER_MODE`
- [ ] `ADMIN_SESSION_SECRET`
- [ ] `ADMIN_EMAIL`
- [ ] `ADMIN_PASSWORD`
- [ ] `BUSINESS_TIMEZONE`
- [ ] `BUFFER_MINUTES`
- [ ] `BOOKING_MIN_NOTICE_HOURS`
- [ ] `CANCEL_POLICY_HOURS`

### Optional Variables

- [ ] `GOOGLE_CALENDAR_ID` (if using custom scheduler)
- [ ] `GOOGLE_CLIENT_EMAIL` (if using custom scheduler)
- [ ] `GOOGLE_PRIVATE_KEY` (if using custom scheduler)
- [ ] `NEXT_PUBLIC_GA4_ID` (if using analytics)
- [ ] `GOOGLE_SITE_VERIFICATION` (if using SEO)
- [ ] `NEXT_PUBLIC_SCHEDULER_MODE` (default: custom)

## Next Steps

After environment variables are configured:

1. ✅ All variables added to Vercel
2. ✅ Values verified
3. ✅ Environments set correctly
4. ✅ Application redeployed
5. ➡️ Proceed to database migration

---

**Vercel Docs**: https://vercel.com/docs/concepts/projects/environment-variables
