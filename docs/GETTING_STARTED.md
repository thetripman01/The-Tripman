# Getting Started (Quick + Clean)

This project is already built; your job is to **connect real services** (Neon + Stripe + Resend) and deploy.

## Recommended setup order

1. Follow **Environment & API Setup**: `docs/setup/08_ENV_AND_API_SETUP.md`
2. Run the smoke tests before launch: `docs/setup/07_TESTING_AND_LAUNCH.md`

## Local dev quick start

```bash
# 1) Create local env file
cp env.local.example .env.local

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
