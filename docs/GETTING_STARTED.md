# Getting Started (Quick + Clean)

This project is already built; your job is to **connect real services** (Neon + Stripe + Resend) and deploy.

## Recommended setup order

1. **Neon** → get `DATABASE_URL` (`docs/setup/01_NEON_DATABASE_SETUP.md`)
2. **Stripe** → get keys + webhook secret (`docs/setup/02_STRIPE_PAYMENT_SETUP.md`)
3. **Resend** → get `RESEND_API_KEY` (`docs/setup/03_RESEND_EMAIL_SETUP.md`)
4. **Domain + Vercel env vars** (`docs/setup/04_DOMAIN_CONFIGURATION.md`, `docs/setup/05_ENVIRONMENT_VARIABLES.md`)
5. **DB push + seed** (`docs/setup/06_DATABASE_MIGRATION.md`)
6. **Test + launch** (`docs/setup/07_TESTING_AND_LAUNCH.md`)

## Local dev quick start

```bash
# 1) Create local env file
cp env.example .env.local

# 2) Install deps
npm install

# 3) Setup DB (requires DATABASE_URL)
npm run db:generate
npm run db:push
npm run db:seed

# 4) Run
npm run dev
```

## Checklist

Use `docs/SETUP_CHECKLIST.md` to track progress.
