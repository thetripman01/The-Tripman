# TripMan Master Setup Checklist

Use this checklist to track your progress through the entire setup process.

## 📋 Quick Status Overview

- [ ] **Neon Database**: Not Started
- [ ] **Stripe Payment**: Not Started
- [ ] **Resend Email**: Not Started
- [ ] **Domain Configuration**: Not Started
- [ ] **Environment Variables**: Not Started
- [ ] **Database Migration**: Not Started
- [ ] **Testing**: Not Started
- [ ] **Launch**: Not Started

---

## Phase 1: Account Creation (30 minutes)

### Neon Database
- [ ] Create account at https://neon.tech
- [ ] Create new project
- [ ] Copy `DATABASE_URL` connection string
- [ ] Save connection string securely

**Time**: ~5 minutes  
**Cost**: Free tier available

---

### Stripe Payment
- [ ] Create account at https://stripe.com
- [ ] Complete business information
- [ ] Activate account (for live payments)
- [ ] Get test API keys (`pk_test_`, `sk_test_`)
- [ ] Get live API keys (`pk_live_`, `sk_live_`)
- [ ] Set up webhook endpoint
- [ ] Copy webhook secret (`whsec_...`)
- [ ] Enable payment methods

**Time**: ~10 minutes  
**Cost**: 2.9% + 30¢ per transaction

---

### Resend Email
- [ ] Create account at https://resend.com
- [ ] Get API key (`re_...`)
- [ ] (Optional) Verify domain in GoDaddy
- [ ] Add DNS records for email verification

**Time**: ~5 minutes  
**Cost**: Free tier (3,000 emails/month)

---

### Vercel (Already Have)
- [x] Account created
- [ ] Repository connected
- [ ] Project created

---

### GoDaddy Domain (Already Have)
- [x] Account created
- [ ] Domain purchased (if not already)
- [ ] DNS access ready

---

## Phase 2: Service Configuration (30 minutes)

### Neon Configuration
- [ ] Project created
- [ ] Database connection string saved
- [ ] Connection tested (optional)

---

### Stripe Configuration
- [ ] Test keys obtained
- [ ] Live keys obtained
- [ ] Webhook endpoint created
- [ ] Webhook secret saved
- [ ] Payment methods enabled
- [ ] Test payment successful

---

### Resend Configuration
- [ ] API key obtained
- [ ] Domain verified (recommended)
- [ ] DNS records added (if verifying domain)
- [ ] Test email sent successfully

---

## Phase 3: Domain Setup (15 minutes)

### GoDaddy DNS Configuration
- [ ] Log in to GoDaddy
- [ ] Navigate to domain DNS settings
- [ ] Choose configuration method:
  - [ ] Option A: Use Vercel nameservers (easiest)
  - [ ] Option B: Use DNS records (keep GoDaddy DNS)

### Vercel Domain Configuration
- [ ] Add domain in Vercel dashboard
- [ ] Configure DNS (nameservers or records)
- [ ] Wait for DNS propagation (10-30 minutes)
- [ ] Verify domain in Vercel
- [ ] SSL certificate activated (automatic)

### Update Services
- [ ] Update `NEXT_PUBLIC_SITE_URL` in Vercel
- [ ] Update Stripe webhook URL to production domain
- [ ] Update Resend email addresses (if domain verified)

---

## Phase 4: Environment Variables (15 minutes)

### Add to Vercel
- [ ] `DATABASE_URL` - From Neon
- [ ] `STRIPE_SECRET_KEY` - From Stripe (live)
- [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - From Stripe (live)
- [ ] `STRIPE_WEBHOOK_SECRET` - From Stripe
- [ ] `RESEND_API_KEY` - From Resend
- [ ] `NEXT_PUBLIC_SITE_URL` - Your domain
- [ ] `ADMIN_EMAIL` - Your admin email
- [ ] `ADMIN_PASSWORD` - Strong password
- [ ] `BUSINESS_TIMEZONE` - Your timezone
- [ ] `BUFFER_MINUTES` - 15 (or your preference)
- [ ] `BOOKING_MIN_NOTICE_HOURS` - 24 (or your preference)
- [ ] `CANCEL_POLICY_HOURS` - 12 (or your preference)

### Optional Variables
- [ ] `GOOGLE_CALENDAR_ID` - If using custom scheduler
- [ ] `GOOGLE_CLIENT_EMAIL` - If using custom scheduler
- [ ] `GOOGLE_PRIVATE_KEY` - If using custom scheduler
- [ ] `NEXT_PUBLIC_GA4_ID` - If using analytics
- [ ] `GOOGLE_SITE_VERIFICATION` - If using SEO

### Verify
- [ ] All variables added
- [ ] Values are correct
- [ ] Environments set correctly (Production/Preview/Development)

---

## Phase 5: Database Migration (10 minutes)

### Local Setup
- [ ] Install dependencies: `npm install`
- [ ] Generate Prisma Client: `npm run db:generate`
- [ ] Push schema: `npm run db:push`
- [ ] Seed data: `npm run db:seed:production`

### Verify
- [ ] Schema pushed successfully
- [ ] Event types created (4 default services)
- [ ] Admin user created (if env vars set)
- [ ] Database accessible in Neon dashboard

---

## Phase 6: Deployment (10 minutes)

### Vercel Deployment
- [ ] Push code to GitHub (if not already)
- [ ] Vercel auto-deploys (or trigger manually)
- [ ] Build succeeds
- [ ] Deployment completes
- [ ] Site is accessible

### Verify Deployment
- [ ] Site loads correctly
- [ ] No build errors
- [ ] Environment variables loaded
- [ ] SSL certificate active

---

## Phase 7: Testing (60 minutes)

### Basic Functionality
- [ ] Landing page loads
- [ ] Services display correctly
- [ ] Booking form works
- [ ] Date/time selection works
- [ ] Form validation works

### Payment Testing
- [ ] Test payment with test card
- [ ] Payment succeeds
- [ ] Webhook received in Stripe
- [ ] Booking confirmed
- [ ] Payment confirmation email sent

### Email Testing
- [ ] Booking confirmation email received
- [ ] Admin notification email received
- [ ] Email formatting correct
- [ ] ICS file attached

### Admin Panel
- [ ] Admin login works
- [ ] Bookings list displays
- [ ] Booking details view works
- [ ] Status updates work
- [ ] Fraud alerts display (if any)

### Mobile Testing
- [ ] Site works on mobile
- [ ] Forms are usable
- [ ] Payment form works
- [ ] Admin panel accessible

### Performance
- [ ] Page load speed acceptable
- [ ] API responses fast
- [ ] No console errors

---

## Phase 8: Pre-Launch (15 minutes)

### Final Checks
- [ ] All tests passed
- [ ] Content reviewed
- [ ] Configuration verified
- [ ] Stripe switched to live mode
- [ ] Webhook URL updated to production
- [ ] All environment variables correct

### Switch to Production
- [ ] Update Stripe to live keys in Vercel
- [ ] Update webhook to production URL
- [ ] Redeploy application
- [ ] Verify live site works

---

## Phase 9: Launch (30 minutes)

### Launch Steps
- [ ] Final deployment complete
- [ ] Live site tested
- [ ] Real test payment made (small amount)
- [ ] All features verified
- [ ] Monitoring active

### Go Live
- [ ] Site is live and accessible
- [ ] All systems operational
- [ ] Ready for customers

### Post-Launch
- [ ] Monitor for first 24 hours
- [ ] Check for any issues
- [ ] Gather initial feedback
- [ ] Celebrate! 🎉

---

## 📊 Progress Tracking

### Current Status
- **Phase 1 (Accounts)**: ⏳ In Progress
- **Phase 2 (Configuration)**: ⏳ Pending
- **Phase 3 (Domain)**: ⏳ Pending
- **Phase 4 (Env Vars)**: ⏳ Pending
- **Phase 5 (Database)**: ⏳ Pending
- **Phase 6 (Deployment)**: ⏳ Pending
- **Phase 7 (Testing)**: ⏳ Pending
- **Phase 8 (Pre-Launch)**: ⏳ Pending
- **Phase 9 (Launch)**: ⏳ Pending

### Estimated Time Remaining
- **Total Setup Time**: ~3 hours
- **Time Spent**: Track as you go
- **Time Remaining**: Calculate based on progress

---

## 🚨 Critical Path

These items MUST be completed in order:

1. ✅ Create accounts (Neon, Stripe, Resend)
2. ✅ Get API keys and connection strings
3. ✅ Configure domain DNS
4. ✅ Add environment variables to Vercel
5. ✅ Run database migration
6. ✅ Deploy to Vercel
7. ✅ Test all features
8. ✅ Switch to live mode
9. ✅ Launch!

---

## 📝 Notes Section

Use this space to track notes, issues, or reminders:

```
Date: ___________
Notes:
- 
- 
- 

Issues Encountered:
- 
- 
- 

Resolutions:
- 
- 
- 
```

---

## 🎯 Quick Reference

### Important URLs
- **Neon Dashboard**: https://console.neon.tech
- **Stripe Dashboard**: https://dashboard.stripe.com
- **Resend Dashboard**: https://resend.com/emails
- **Vercel Dashboard**: https://vercel.com/dashboard
- **GoDaddy**: https://www.godaddy.com

### Support Links
- **Neon Docs**: https://neon.tech/docs
- **Stripe Docs**: https://stripe.com/docs
- **Resend Docs**: https://resend.com/docs
- **Vercel Docs**: https://vercel.com/docs

### Test Cards (Stripe Test Mode)
- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **3D Secure**: `4000 0027 6000 3184`

---

**Last Updated**: Track your progress date here  
**Status**: Update as you progress  
**Next Session**: Note what to do next

---

## ✅ Completion Checklist

When all items are checked, you're ready to launch!

- [ ] All accounts created
- [ ] All API keys obtained
- [ ] Domain configured
- [ ] Environment variables set
- [ ] Database migrated
- [ ] Site deployed
- [ ] All tests passed
- [ ] Live mode activated
- [ ] **READY TO LAUNCH!** 🚀

---

**Good luck with your launch!** 🎉

