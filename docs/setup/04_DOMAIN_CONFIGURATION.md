# Domain Configuration Guide (GoDaddy)

## Step 1: Purchase Domain (If Not Already)

1. Go to https://godaddy.com
2. Search for your desired domain (e.g., `tripman.com`)
3. Add to cart and complete purchase
4. Wait for domain to be activated (usually instant)

## Step 2: Get Vercel DNS Information

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Domains**
3. Click **"Add Domain"**
4. Enter your domain (e.g., `tripman.com`)
5. Vercel will show you DNS configuration options

### Option A: Use Vercel Nameservers (Recommended)

Vercel will provide nameservers like:
```
ns1.vercel-dns.com
ns2.vercel-dns.com
```

### Option B: Use DNS Records (If keeping GoDaddy DNS)

Vercel will provide DNS records:
- **A Record**: `76.76.19.61` (or similar)
- **CNAME Record**: `cname.vercel-dns.com`

## Step 3: Configure DNS in GoDaddy

### Method 1: Use Vercel Nameservers (Easiest)

1. Log in to GoDaddy
2. Go to **My Products** → **Domains**
3. Click on your domain
4. Click **"DNS"** or **"Manage DNS"**
5. Scroll to **"Nameservers"** section
6. Click **"Change"**
7. Select **"Custom"**
8. Delete existing nameservers
9. Add Vercel nameservers:
   - `ns1.vercel-dns.com`
   - `ns2.vercel-dns.com`
10. Click **"Save"**
11. Wait for propagation (5 minutes to 48 hours, usually 10-30 minutes)

### Method 2: Use DNS Records (Keep GoDaddy DNS)

1. Log in to GoDaddy
2. Go to **My Products** → **Domains**
3. Click on your domain
4. Click **"DNS"** or **"Manage DNS"**
5. **Add A Record**:
   - **Type**: A
   - **Name**: `@` (or leave blank for root domain)
   - **Value**: `76.76.19.61` (from Vercel)
   - **TTL**: 600 (or default)

6. **Add CNAME Record** (for www):
   - **Type**: CNAME
   - **Name**: `www`
   - **Value**: `cname.vercel-dns.com` (from Vercel)
   - **TTL**: 600 (or default)

7. **Save** all changes
8. Wait for DNS propagation

## Step 4: Add Domain in Vercel

1. Go to Vercel project → **Settings** → **Domains**
2. Click **"Add Domain"**
3. Enter your domain: `tripman.com`
4. Click **"Add"**
5. Vercel will verify DNS configuration
6. Wait for verification (can take a few minutes)

## Step 5: Configure SSL Certificate

1. Vercel automatically provisions SSL certificates
2. Go to **Settings** → **Domains**
3. Your domain should show **"Valid"** with SSL enabled
4. SSL is usually active within minutes

## Step 6: Update Environment Variables

Update your site URL in Vercel:

```env
NEXT_PUBLIC_SITE_URL=https://tripman.com
```

(Replace `tripman.com` with your actual domain)

## Step 7: Update Email Domain (Resend)

If you verified your domain in Resend:
1. Go to Resend → **Domains**
2. Ensure domain is verified
3. Update email "from" addresses to use your domain

## Step 8: Update Stripe Webhook URL

1. Go to Stripe Dashboard → **Developers** → **Webhooks**
2. Edit your webhook endpoint
3. Update URL to:
   ```
   https://yourdomain.com/api/payment/webhook
   ```
4. Save changes
5. Copy new webhook secret if it changed

## Step 9: Test Domain Configuration

### Test DNS Propagation

Use online tools to check:
- https://dnschecker.org
- https://www.whatsmydns.net

Enter your domain and check:
- A record points to Vercel IP
- CNAME record points correctly
- Nameservers are updated (if using Vercel nameservers)

### Test Website Access

1. Wait 10-30 minutes after DNS changes
2. Visit `https://yourdomain.com`
3. Should load your Vercel site
4. Check SSL certificate (should show valid)

### Test Subdomain (www)

1. Visit `https://www.yourdomain.com`
2. Should redirect to or load same as root domain

## Important Notes

### DNS Propagation
- **Typical time**: 10-30 minutes
- **Maximum time**: Up to 48 hours
- **Factors**: TTL settings, DNS cache, geographic location

### SSL Certificate
- **Automatic**: Vercel handles SSL
- **Time to activate**: Usually 5-15 minutes
- **Renewal**: Automatic
- **Type**: Let's Encrypt (free)

### Domain Best Practices
- ✅ Use HTTPS always (automatic with Vercel)
- ✅ Set up www redirect (Vercel handles this)
- ✅ Keep DNS records minimal
- ✅ Monitor domain expiration
- ✅ Enable domain privacy (optional)

### Common Issues

#### Domain Not Resolving
- Wait longer (up to 48 hours)
- Clear DNS cache: `ipconfig /flushdns` (Windows)
- Check DNS records are correct
- Verify nameservers are updated

#### SSL Not Working
- Wait 15-30 minutes after domain verification
- Check domain is verified in Vercel
- Ensure DNS is correctly configured
- Contact Vercel support if issues persist

#### www Not Working
- Vercel should handle www automatically
- Check CNAME record is set correctly
- Verify redirect is configured in Vercel

## Next Steps

After domain configuration:
1. ✅ Domain points to Vercel
2. ✅ SSL certificate active
3. ✅ Update `NEXT_PUBLIC_SITE_URL`
4. ✅ Update Stripe webhook URL
5. ✅ Update Resend email addresses
6. ➡️ Proceed to environment variables setup

---

**GoDaddy Support**: https://www.godaddy.com/help
**Vercel DNS Docs**: https://vercel.com/docs/concepts/projects/domains
**DNS Checker**: https://dnschecker.org

