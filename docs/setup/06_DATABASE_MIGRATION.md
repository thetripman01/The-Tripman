# Database Migration Guide

## Prerequisites

Before running migrations, ensure:
- ✅ Neon database is set up
- ✅ `DATABASE_URL` is configured in Vercel
- ✅ You have access to terminal/command line
- ✅ Node.js and npm are installed

## Step 1: Install Dependencies

If you haven't already:

```bash
npm install
```

This installs all required packages including Prisma.

## Step 2: Generate Prisma Client

Generate the Prisma Client based on your schema:

```bash
npm run db:generate
```

**What this does**:
- Reads `prisma/schema.prisma`
- Generates TypeScript types
- Creates Prisma Client

**Expected output**:
```
✔ Generated Prisma Client
```

## Step 3: Push Schema to Database

Push your Prisma schema to the Neon database:

```bash
npm run db:push
```

**What this does**:
- Creates all tables in database
- Sets up relationships
- Creates indexes
- Applies schema changes

**Expected output**:
```
✔ Your database is now in sync with your Prisma schema.
```

**If you see errors**:
- Check `DATABASE_URL` is correct
- Verify database is accessible
- Check network connection
- Review error messages

## Step 4: Seed Production Data

Seed your database with initial data:

```bash
npm run db:seed:production
```

**What this does**:
- Creates default event types (services)
- Creates admin user (if env vars are set)
- Sets up initial data

**Expected output**:
```
✅ Seeded production data successfully
```

## Step 5: Verify Database Setup

### Option A: Using Prisma Studio

Open Prisma Studio to view your database:

```bash
npm run db:studio
```

This opens a browser at `http://localhost:5555` where you can:
- View all tables
- See data
- Edit records (carefully!)

### Option B: Using Neon SQL Editor

1. Go to Neon Dashboard
2. Click on your project
3. Go to **SQL Editor**
4. Run queries:

```sql
-- Check event types
SELECT * FROM "EventType";

-- Check admin users
SELECT * FROM "AdminUser";

-- Check bookings (should be empty initially)
SELECT * FROM "Booking";
```

## Step 6: Verify Event Types

Your seed script should create these default event types:

1. **Birthday Uber Ride**
   - Duration: 60 minutes
   - Price: $75.00

2. **Airport Pick-Up**
   - Duration: 45 minutes
   - Price: $60.00

3. **City Night Tour**
   - Duration: 90 minutes
   - Price: $120.00

4. **Surprise Date Ride**
   - Duration: 60 minutes
   - Price: $85.00

**Verify in database**:
- All 4 event types exist
- Prices are correct
- Durations are correct
- All are active (`isActive: true`)

## Step 7: Verify Admin User

If `ADMIN_EMAIL` and `ADMIN_PASSWORD` are set:

1. Check admin user was created:
   ```sql
   SELECT * FROM "AdminUser";
   ```

2. Test admin login:
   - Go to `https://yourdomain.com/admin`
   - Try logging in with your admin credentials
   - Should successfully authenticate

## Step 8: Test Database Operations

### Test Booking Creation

1. Make a test booking through your website
2. Check database:
   ```sql
   SELECT * FROM "Booking" ORDER BY "createdAt" DESC LIMIT 1;
   ```
3. Verify booking was created correctly

### Test Relationships

Verify relationships work:
```sql
-- Get booking with event type
SELECT 
  b.*,
  e.name as event_type_name,
  e.priceCents as event_type_price
FROM "Booking" b
JOIN "EventType" e ON b."eventTypeId" = e.id
LIMIT 1;
```

## Common Issues & Solutions

### Issue: "Can't reach database server"

**Solutions**:
- Check `DATABASE_URL` is correct
- Verify database is running in Neon
- Check network connection
- Verify SSL mode in connection string (`?sslmode=require`)

### Issue: "Schema is out of sync"

**Solutions**:
- Run `npm run db:push` again
- Check for schema changes
- Review Prisma schema file

### Issue: "Seed script fails"

**Solutions**:
- Check environment variables are set
- Verify database connection
- Review seed script for errors
- Check if data already exists (may need to clear first)

### Issue: "Admin user not created"

**Solutions**:
- Verify `ADMIN_EMAIL` and `ADMIN_PASSWORD` are set
- Check seed script ran successfully
- Manually create admin user if needed

## Manual Admin User Creation

If admin user wasn't created, create it manually:

```bash
# Using Prisma Studio
npm run db:studio
# Then manually add admin user

# Or using SQL
# In Neon SQL Editor, run:
```

```sql
-- Hash password first (use bcrypt)
-- Then insert:
INSERT INTO "AdminUser" (id, email, password, "createdAt", "updatedAt")
VALUES (
  'clx...', -- Generate a CUID
  'admin@yourdomain.com',
  '$2a$10$...', -- Hashed password (use bcrypt)
  NOW(),
  NOW()
);
```

**Better approach**: Use the seed script with correct env vars.

## Database Schema Overview

Your database has these tables:

### EventType
- Service offerings
- Pricing and duration
- Active/inactive status

### Booking
- Customer bookings
- Payment information
- Status tracking
- Links to EventType

### AdminUser
- Admin authentication
- Email and hashed password

### Ride
- Real-time tracking
- Driver information
- Status updates
- Links to Booking

### Location
- GPS coordinates
- Timestamps
- Links to Ride

## Maintenance

### Regular Backups
- Neon provides automatic backups
- Check backup settings in Neon Dashboard
- Consider manual exports for important data

### Schema Updates
When you need to update schema:

1. Edit `prisma/schema.prisma`
2. Run `npm run db:generate`
3. Run `npm run db:push`
4. Test changes

### Data Migration
For production data migrations:
- Use Prisma migrations: `npm run db:migrate`
- Or use SQL scripts in Neon SQL Editor
- Always test in preview/staging first

## Next Steps

After database migration is complete:
1. ✅ Schema pushed to database
2. ✅ Production data seeded
3. ✅ Event types verified
4. ✅ Admin user created (if applicable)
5. ✅ Database operations tested
6. ➡️ Proceed to testing and launch

---

**Prisma Docs**: https://www.prisma.io/docs
**Neon Docs**: https://neon.tech/docs

