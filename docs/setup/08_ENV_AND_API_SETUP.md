# Environment & API Setup (Copy/Paste + Step-by-Step)

This guide tells you **exactly** what to put in your `.env.local` / Vercel Environment Variables and how to get each value.

## 1) Local setup

1. Copy `env.local.example` → `.env.local`
2. Fill in the values you have.
3. Run:

```bash
npm run db:push
npm run db:seed
npm run dev
```

## 2) Production (Vercel) setup

1. Go to **Vercel → Project → Settings → Environment Variables**
2. Add the same keys as production values
3. Redeploy
4. After `DATABASE_URL` is set, run (from your machine) against production:

```bash
npm run db:push
npm run db:seed:production
```

## 3) Neon (DATABASE_URL)

1. Go to `neon.tech` and open your project.
2. Click **Connect**.
3. Choose:
   - **Branch**: `production` (or your target branch)
   - **Role**: `neondb_owner`
   - **Database**: `neondb`
   - **Connection pooling**: ON (recommended for Vercel)
4. Copy the **URL inside quotes** from the snippet like:
   - `psql 'postgresql://....'`
5. Paste that URL into:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST/neondb?sslmode=require"
```

## 4) Resend (RESEND_API_KEY)

1. Go to `resend.com`
2. **API Keys → Create API Key**
3. Paste into:

```env
RESEND_API_KEY="re_..."
```

## 5) Stripe (payments + webhooks)

### A) API keys

1. Go to `dashboard.stripe.com`
2. Toggle **Test mode** for development
3. **Developers → API keys**
4. Copy:

```env
STRIPE_SECRET_KEY="sk_test_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
```

### B) Webhook secret

1. Stripe Dashboard → **Developers → Webhooks**
2. **Add endpoint**
3. Endpoint URL:
   - Local: `http://localhost:3000/api/payment/webhook`
   - Production: `https://YOUR_DOMAIN/api/payment/webhook`
4. Select events:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
5. Create → reveal **Signing secret**:

```env
STRIPE_WEBHOOK_SECRET="whsec_..."
```

## 6) Admin login (ADMIN_EMAIL / ADMIN_PASSWORD)

These are **seed-time credentials** that create/update the `AdminUser` row in the database.

1. Set:

```env
ADMIN_EMAIL="you@example.com"
ADMIN_PASSWORD="a-strong-password"
```

2. Run:

```bash
npm run db:seed
```

3. Log in at `/admin/login` using those values.

### ADMIN_SESSION_SECRET

This signs the cookie session. Generate a long random secret and keep it stable:

```env
ADMIN_SESSION_SECRET="CHANGE_ME_LONG_RANDOM_SECRET"
```

## 7) Availability: working hours + Google Calendar blocking

### A) Default working hours

The app currently generates slots using default working hours in `src/lib/calendar.ts` (`getWorkingHours()`).

### B) Google Calendar (recommended)

If configured, any busy events in your calendar will block booking slots.

#### Step-by-step (Google Cloud)

1. Go to `console.cloud.google.com`
2. Create/select a project
3. **APIs & Services → Library** → enable **Google Calendar API**
4. **IAM & Admin → Service Accounts** → create service account
5. Open service account → **Keys → Add Key → Create new key → JSON**

#### Share your Google Calendar with the service account

1. Go to `calendar.google.com`
2. Create or select a calendar
3. Calendar settings → **Share with specific people**
4. Add the service account email (`...iam.gserviceaccount.com`)
5. Give permission: **Make changes to events**

#### Put these into env

From the JSON file:

- `client_email` → `GOOGLE_CLIENT_EMAIL`
- `private_key` → `GOOGLE_PRIVATE_KEY` (keep `\n`)

From calendar settings:

- Calendar ID → `GOOGLE_CALENDAR_ID`

```env
GOOGLE_CALENDAR_ID="your-calendar-id@group.calendar.google.com"
GOOGLE_CLIENT_EMAIL="service-account@project.iam.gserviceaccount.com"
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

## 8) Analytics (GA4) – optional

1. Go to `analytics.google.com`
2. Create a GA4 property and Web stream
3. Copy measurement ID (starts with `G-`)

```env
NEXT_PUBLIC_GA4_ID="G-XXXXXXXXXX"
```

## 9) Instagram latest embed – optional

The API route `src/app/api/instagram/latest/route.ts` fetches the **latest video (reel)** and embeds it. When you upload a new reel, it auto-shows. Required:

```env
IG_USER_ID=""
IG_USER_TOKEN=""
FB_APP_ID=""
FB_APP_SECRET=""
```

High level:

1. Create a Meta app at `developers.facebook.com`
2. Connect Instagram to a Facebook page and enable Instagram Graph API
3. Generate a user token with permissions: `instagram_basic`, `pages_show_list`
4. Set the values above

If you want, we can walk through your Meta app screens and I’ll tailor the exact steps to your current setup.

## 10) WhatsApp/Phone buttons – optional

```env
NEXT_PUBLIC_WHATSAPP_NUMBER="14161234567"
NEXT_PUBLIC_PHONE_NUMBER="+14161234567"
```

## 11) Tracking update secret (recommended)

Protects `/api/tracking/update-location` and `/api/tracking/update-status` (non-admin usage):

```env
TRACKING_API_SECRET="CHANGE_ME_LONG_RANDOM_SECRET"
```
