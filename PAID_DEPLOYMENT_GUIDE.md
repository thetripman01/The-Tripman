# TripMan Paid Deployment Guide

## 🚀 **Step-by-Step Account Setup (Paid Versions)**

### **💰 Monthly Costs (Paid Setup)**
- **Vercel Pro**: $20/month
- **Neon Pro**: $19/month  
- **Stripe**: 2.9% + 30¢ per transaction
- **Resend Pro**: $20/month
- **Domain**: $12/year
- **Total**: $60/month + transaction fees

---

## **Step 1: Vercel Account Setup (10 minutes)**

### **1.1 Create Vercel Account**
```bash
# Go to https://vercel.com
# Click "Sign Up"
# Choose "Continue with GitHub" (recommended)
# Connect your GitHub account
# Complete profile setup
```

### **1.2 Deploy Project**
```bash
# In Vercel dashboard:
# 1. Click "New Project"
# 2. Import from GitHub
# 3. Select your TripMan repository
# 4. Click "Deploy"
# 5. Wait for deployment to complete
# 6. Get URL: https://your-project-name.vercel.app
```

### **1.3 Upgrade to Pro**
```bash
# In Vercel dashboard:
# 1. Go to "Settings" → "Billing"
# 2. Click "Upgrade to Pro"
# 3. Pay $20/month
# 4. Get unlimited bandwidth and features
```

---

## **Step 2: Neon Database Setup (10 minutes)**

### **2.1 Create Neon Account**
```bash
# Go to https://neon.tech
# Click "Sign Up"
# Choose "Continue with GitHub" (recommended)
# Connect your GitHub account
# Complete profile setup
```

### **2.2 Create Project**
```bash
# In Neon dashboard:
# 1. Click "Create Project"
# 2. Name: "tripman-production"
# 3. Region: Choose closest to your customers
# 4. Click "Create Project"
```

### **2.3 Upgrade to Pro**
```bash
# In Neon dashboard:
# 1. Go to "Settings" → "Billing"
# 2. Click "Upgrade to Pro"
# 3. Pay $19/month
# 4. Get 10GB storage and unlimited connections
```

### **2.4 Get Database URL**
```bash
# After project creation:
# 1. Go to "Dashboard" tab
# 2. Copy "Connection String"
# 3. It looks like: postgresql://user:password@host/database
# 4. This is your DATABASE_URL
```

---

## **Step 3: Stripe Account Setup (15 minutes)**

### **3.1 Create Stripe Account**
```bash
# Go to https://stripe.com
# Click "Start now"
# Fill in business information:
# - Business name: TripMan
# - Business type: Transportation
# - Country: Your country
# - Currency: USD (or your preferred)
# Verify email address
```

### **3.2 Complete Business Setup**
```bash
# In Stripe dashboard:
# 1. Go to "Settings" → "Business settings"
# 2. Complete business information
# 3. Add business address
# 4. Add bank account details
# 5. Verify business information
```

### **3.3 Get API Keys**
```bash
# In Stripe dashboard:
# 1. Go to "Developers" → "API keys"
# 2. Copy "Publishable key" (pk_live_...)
# 3. Copy "Secret key" (sk_live_...)
# 4. These are your Stripe keys
```

### **3.4 Set Up Webhooks**
```bash
# In Stripe dashboard:
# 1. Go to "Developers" → "Webhooks"
# 2. Click "Add endpoint"
# 3. URL: https://your-domain.com/api/payment/webhook
# 4. Events: Select "payment_intent.succeeded" and "payment_intent.payment_failed"
# 5. Copy "Signing secret" (whsec_...)
```

---

## **Step 4: Resend Account Setup (10 minutes)**

### **4.1 Create Resend Account**
```bash
# Go to https://resend.com
# Click "Sign Up"
# Choose "Continue with GitHub" (recommended)
# Connect your GitHub account
# Complete profile setup
```

### **4.2 Upgrade to Pro**
```bash
# In Resend dashboard:
# 1. Go to "Settings" → "Billing"
# 2. Click "Upgrade to Pro"
# 3. Pay $20/month
# 4. Get 50,000 emails/month and advanced features
```

### **4.3 Get API Key**
```bash
# In Resend dashboard:
# 1. Go to "API Keys"
# 2. Click "Create API Key"
# 3. Name: "tripman-production"
# 4. Copy the API key (re_...)
```

### **4.4 Verify Domain (Optional but Recommended)**
```bash
# For production emails:
# 1. Go to "Domains"
# 2. Add your domain (e.g., tripman.com)
# 3. Follow DNS verification steps
# 4. This ensures emails don't go to spam
```

---

## **Step 5: Domain Purchase (10 minutes)**

### **5.1 Buy Domain**
```bash
# Go to any registrar:
# - GoDaddy: https://godaddy.com
# - Namecheap: https://namecheap.com
# - Google Domains: https://domains.google
# - Cloudflare: https://cloudflare.com

# Search for your preferred domain
# Purchase domain (usually $10-15/year)
# Examples: tripman.com, tripman.co, tripman.io
```

### **5.2 Configure DNS**
```bash
# In your domain registrar:
# 1. Go to DNS management
# 2. Add CNAME record:
#    Name: www
#    Value: cname.vercel-dns.com
# 3. Add A record:
#    Name: @
#    Value: 76.76.19.61 (Vercel IP)
```

---

## **Step 6: Configure Environment Variables (15 minutes)**

### **6.1 Add Environment Variables in Vercel**
```bash
# In Vercel dashboard:
# 1. Go to your project
# 2. Click "Settings" → "Environment Variables"
# 3. Add each variable:

# Database
DATABASE_URL="postgresql://user:password@host/database"

# Stripe
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_PUBLISHABLE_KEY="pk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Email
RESEND_API_KEY="re_..."

# Site Configuration
NEXT_PUBLIC_SITE_URL="https://your-domain.com"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_..."

# Admin Authentication
ADMIN_EMAIL="admin@your-domain.com"
ADMIN_PASSWORD="your-secure-password"

# Business Configuration
BUSINESS_TIMEZONE="America/Toronto"
BUFFER_MINUTES=15
BOOKING_MIN_NOTICE_HOURS=24
CANCEL_POLICY_HOURS=12

# Google Calendar (Optional)
GOOGLE_CALENDAR_ID="your-calendar@group.calendar.google.com"
GOOGLE_CLIENT_EMAIL="service-account@project.iam.gserviceaccount.com"
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Analytics (Optional)
NEXT_PUBLIC_GA4_ID="G-XXXXXXXXXX"
```

### **6.2 Redeploy**
```bash
# After adding environment variables:
# 1. Go to "Deployments" tab
# 2. Click "Redeploy" on latest deployment
# 3. Wait for deployment to complete
```

---

## **Step 7: Database Setup (10 minutes)**

### **7.1 Run Database Migration**
```bash
# In your local terminal:
# 1. Install Vercel CLI: npm i -g vercel
# 2. Login: vercel login
# 3. Link project: vercel link
# 4. Pull environment variables: vercel env pull .env.local
# 5. Push schema: npx prisma db push
```

### **7.2 Seed Production Data**
```bash
# Run production seeding:
npm run db:seed:production
```

---

## **Step 8: Test & Launch (20 minutes)**

### **8.1 Core Functionality Test**
```bash
# Test these features:
# 1. Landing page loads
# 2. Service selection works
# 3. Booking form functions
# 4. Payment processing works
# 5. Email notifications sent
# 6. Admin panel accessible
```

### **8.2 Payment Test**
```bash
# Test with Stripe test card:
# Card: 4242 4242 4242 4242
# Expiry: Any future date
# CVC: Any 3 digits
# Verify payment confirmation
```

### **8.3 Email Test**
```bash
# Test email delivery:
# 1. Make a test booking
# 2. Check email delivery
# 3. Verify email content
# 4. Test admin notifications
```

---

## **🎯 Launch Checklist**

### **✅ Pre-Launch Checklist**
- [ ] Vercel Pro account created
- [ ] Neon Pro database created
- [ ] Stripe account created and configured
- [ ] Resend Pro account created
- [ ] Domain purchased and configured
- [ ] Environment variables configured
- [ ] Database schema deployed
- [ ] Production data seeded
- [ ] All features tested
- [ ] Payment processing verified
- [ ] Email delivery confirmed

### **🎉 Launch Day**
1. **Deploy to production**
2. **Configure domain DNS**
3. **Test live site**
4. **Make test booking**
5. **Verify payment processing**
6. **Check email delivery**
7. **Launch!** 🚀

---

## **💰 Total Setup Cost**

### **One-time Costs:**
- **Domain**: $12/year
- **Setup Time**: 2 hours

### **Monthly Costs:**
- **Vercel Pro**: $20/month
- **Neon Pro**: $19/month
- **Resend Pro**: $20/month
- **Stripe**: 2.9% + 30¢ per transaction
- **Domain**: $1/month
- **Total**: $60/month + transaction fees

---

## **🚀 Ready to Start?**

**Let's begin with Step 1: Vercel Account Setup**

**Would you like me to guide you through creating the Vercel account first?**
