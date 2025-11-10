# Neon Database Setup Guide

## Step 1: Create Neon Account

1. Go to https://neon.tech
2. Click **"Sign Up"** or **"Get Started"**
3. Sign up with:
   - GitHub (recommended - easiest)
   - Email
   - Google account

## Step 2: Create a New Project

1. After signing in, click **"Create Project"**
2. Fill in the details:
   - **Project Name**: `tripman-production` (or your preferred name)
   - **Region**: Choose closest to your users (e.g., `US East (Ohio)`)
   - **PostgreSQL Version**: `16` (latest stable)
   - **Compute Size**: Start with **Free tier** (can upgrade later)

3. Click **"Create Project"**

## Step 3: Get Database Connection String

1. Once project is created, you'll see the **Connection Details** panel
2. Look for **"Connection string"** section
3. You'll see something like:
   ```
   postgresql://username:password@ep-xxx-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
4. Click **"Copy"** to copy the connection string
5. **IMPORTANT**: Save this securely - you'll need it for environment variables

## Step 4: Test Connection (Optional)

You can test the connection using:
- **Neon SQL Editor** (built-in)
- **psql** command line
- **Prisma Studio** (after setup)

## Step 5: Configure Environment Variable

Add this to your Vercel environment variables:
- **Variable Name**: `DATABASE_URL`
- **Value**: Your connection string from Step 3
- **Environment**: Production, Preview, Development (all)

## Step 6: Database Migration

After setting up environment variables, run migrations:

```bash
# Generate Prisma Client
npm run db:generate

# Push schema to database
npm run db:push

# Seed production data
npm run db:seed:production
```

## Step 7: Verify Setup

1. Go to Neon Dashboard → **SQL Editor**
2. Run a test query:
   ```sql
   SELECT * FROM "EventType";
   ```
3. You should see your seeded event types

## Important Notes

### Free Tier Limits
- **Storage**: 3 GB
- **Compute**: 0.5 vCPU, 1 GB RAM
- **Projects**: Unlimited
- **Branches**: 1 per project

### Paid Plans (When Needed)
- **Launch**: $19/month
  - 10 GB storage
  - 1 vCPU, 2 GB RAM
  - Unlimited branches
  - Point-in-time restore

### Security Best Practices
- ✅ Never commit connection strings to Git
- ✅ Use environment variables only
- ✅ Enable SSL (automatic with Neon)
- ✅ Use connection pooling for production

## Troubleshooting

### Connection Issues
- Verify connection string is correct
- Check if SSL mode is enabled (`?sslmode=require`)
- Ensure IP is not blocked (Neon allows all by default)

### Migration Issues
- Make sure `DATABASE_URL` is set correctly
- Run `npm run db:generate` before `db:push`
- Check Prisma schema is valid

### Performance Issues
- Use connection pooling (Neon provides this automatically)
- Consider upgrading compute size if needed
- Monitor query performance in Neon dashboard

## Next Steps

After Neon setup is complete:
1. ✅ Save `DATABASE_URL` securely
2. ✅ Add to Vercel environment variables
3. ✅ Run database migrations
4. ✅ Seed production data
5. ➡️ Proceed to Stripe setup

---

**Support**: https://neon.tech/docs
**Status Page**: https://status.neon.tech

