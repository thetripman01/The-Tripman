# Resend Email Setup Guide

## Step 1: Create Resend Account

1. Go to https://resend.com
2. Click **"Sign Up"** or **"Get Started"**
3. Sign up with:
   - **Email** (recommended)
   - **GitHub** (if preferred)

4. Verify your email address

## Step 2: Get API Key

1. After signing in, go to **API Keys** section
2. Click **"Create API Key"**
3. Fill in details:
   - **Name**: `TripMan Production` (or your preferred name)
   - **Permission**: `Full Access` (or `Sending Access` if you prefer)
   - **Expires**: Never (or set expiration if needed)

4. Click **"Create"**
5. **IMPORTANT**: Copy the API key immediately - it starts with `re_...`
   - You won't be able to see it again!
   - Save it securely

## Step 3: Verify Your Domain (Recommended)

### Why Verify Domain?
- Prevents emails from going to spam
- Professional sender reputation
- Better deliverability
- Custom "from" addresses

### Domain Verification Steps

1. Go to **Domains** → **Add Domain**
2. Enter your domain (e.g., `tripman.com`)
3. Click **"Add Domain"**

4. **Add DNS Records** (in GoDaddy):
   - Resend will show you DNS records to add:
     - **SPF Record** (TXT)
     - **DKIM Record** (TXT)
     - **DMARC Record** (TXT - optional but recommended)

5. **In GoDaddy DNS Management**:
   - Go to GoDaddy → Your Domain → DNS
   - Add each TXT record:
     - **Type**: TXT
     - **Name**: As shown in Resend (usually `@` or domain name)
     - **Value**: The record value from Resend
     - **TTL**: 600 (or default)

6. **Wait for Verification**:
   - DNS propagation can take 5 minutes to 48 hours
   - Usually takes 10-30 minutes
   - Check status in Resend Dashboard

7. **Verify Status**:
   - Go back to Resend → Domains
   - Status should show "Verified" ✅

### Using Verified Domain

Once verified, update your email "from" addresses:
- `bookings@yourdomain.com`
- `notifications@yourdomain.com`
- `payments@yourdomain.com`
- `tracking@yourdomain.com`

## Step 4: Configure Environment Variable

Add this to your Vercel environment variables:

```env
# Resend API Key
RESEND_API_KEY=re_...
```

**Environment Settings**:
- Add to: Production, Preview, Development (all)

## Step 5: Update Email "From" Addresses

After domain verification, update email sending addresses in your code:

### Current (Unverified - Works but may go to spam):
```typescript
from: 'The Tripman <bookings@tripmansite.com>'
```

### After Verification (Recommended):
```typescript
from: 'The Tripman <bookings@yourdomain.com>'
```

**Files to update**:
- `src/lib/email.ts` - Update all `from` addresses

## Step 6: Test Email Sending

### Test Email Function

You can test by:
1. Making a test booking
2. Checking email delivery
3. Verifying email formatting

### Check Resend Dashboard

1. Go to **Emails** → **Logs**
2. See all sent emails
3. Check delivery status
4. View email content
5. Check for bounces or failures

## Step 7: Email Templates (Optional)

Resend supports React Email templates:

1. Install React Email (if not already):
   ```bash
   npm install @react-email/components
   ```

2. Create email templates (optional enhancement)
3. Use templates for better email design

## Important Notes

### Free Tier Limits
- **3,000 emails/month** (free)
- **100 emails/day** sending limit
- Perfect for getting started

### Paid Plans
- **Pro**: $20/month
  - 50,000 emails/month
  - 10,000 emails/day
  - Priority support
  - Advanced analytics

### Email Best Practices
- ✅ Always verify your domain
- ✅ Use professional "from" addresses
- ✅ Include unsubscribe links (for marketing emails)
- ✅ Test email rendering in different clients
- ✅ Monitor bounce rates
- ✅ Keep email content clear and concise

### Email Types in TripMan

Your app sends these emails:
1. **Booking Confirmation** - To customer
2. **Admin Notification** - To admin
3. **Payment Confirmation** - To customer
4. **Cancellation Notification** - To customer
5. **Ride Status Updates** - To customer

## Troubleshooting

### Emails Not Sending
- Check API key is correct
- Verify API key has sending permissions
- Check Resend Dashboard for errors
- Review email logs

### Emails Going to Spam
- Verify your domain (most important!)
- Check SPF, DKIM, DMARC records
- Avoid spam trigger words
- Use professional "from" addresses
- Don't send too many emails at once

### Domain Verification Issues
- Wait longer for DNS propagation (up to 48 hours)
- Verify DNS records are correct
- Check record values match exactly
- Ensure TTL is set correctly
- Try removing and re-adding records

### API Key Issues
- Verify key starts with `re_`
- Check key hasn't expired
- Ensure key has correct permissions
- Regenerate if compromised

## Next Steps

After Resend setup is complete:
1. ✅ Save API key securely
2. ✅ Add to Vercel environment variables
3. ✅ Verify domain (recommended)
4. ✅ Update "from" addresses in code
5. ✅ Test email sending
6. ➡️ Proceed to domain configuration

---

**Documentation**: https://resend.com/docs
**Support**: support@resend.com
**Status**: https://status.resend.com

