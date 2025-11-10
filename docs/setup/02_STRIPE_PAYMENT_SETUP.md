# Stripe Payment Setup Guide

## Step 1: Create Stripe Account

1. Go to https://stripe.com
2. Click **"Start now"** or **"Sign up"**
3. Fill in your business details:
   - **Email address**
   - **Full name**
   - **Password**
   - **Country** (where your business is located)

4. Verify your email address

## Step 2: Complete Business Information

1. After signing up, you'll be prompted to complete your business profile:
   - **Business type**: Individual or Company
   - **Business name**: "The Tripman" (or your business name)
   - **Business website**: Your domain (can add later)
   - **Business description**: Transportation/ride booking service
   - **Phone number**

2. Complete identity verification (may be required):
   - Provide business registration details
   - Upload business documents if required
   - Complete identity verification

## Step 3: Activate Your Account

1. Go to **Dashboard** → **Activate your account**
2. Complete required information:
   - **Business details**
   - **Bank account** (for payouts)
   - **Tax information**
   - **Identity verification**

3. **Note**: You can start testing immediately, but you need to activate for live payments

## Step 4: Get API Keys

### For Testing (Test Mode)
1. Go to **Developers** → **API keys**
2. You'll see **Test mode** toggle (should be ON by default)
3. Copy these keys:
   - **Publishable key**: `pk_test_...`
   - **Secret key**: `sk_test_...` (click "Reveal test key")

### For Production (Live Mode)
1. Toggle **Test mode** to **OFF** (Live mode)
2. Copy these keys:
   - **Publishable key**: `pk_live_...`
   - **Secret key**: `sk_live_...` (click "Reveal live key")

**⚠️ IMPORTANT**: 
- Never share your secret keys
- Never commit keys to Git
- Use test keys for development
- Use live keys only in production

## Step 5: Set Up Webhooks

### Create Webhook Endpoint

1. Go to **Developers** → **Webhooks**
2. Click **"Add endpoint"**
3. Enter endpoint URL:
   ```
   https://yourdomain.com/api/payment/webhook
   ```
   (Use your Vercel preview URL for testing: `https://your-project.vercel.app/api/payment/webhook`)

4. Select events to listen to:
   - ✅ `payment_intent.succeeded`
   - ✅ `payment_intent.payment_failed`
   - ✅ `payment_intent.canceled`
   - ✅ `charge.refunded`
   - ✅ `charge.dispute.created`

5. Click **"Add endpoint"**

### Get Webhook Secret

1. After creating the endpoint, click on it
2. Find **"Signing secret"**
3. Click **"Reveal"** and copy the secret: `whsec_...`
4. Save this securely - you'll need it for `STRIPE_WEBHOOK_SECRET`

## Step 6: Enable Payment Methods

1. Go to **Settings** → **Payment methods**
2. Enable payment methods:
   - ✅ **Cards** (Credit and debit cards)
   - ✅ **Apple Pay** (if you want)
   - ✅ **Google Pay** (if you want)
   - ✅ **Link** (Stripe's one-click checkout)

3. Configure each payment method as needed

## Step 7: Configure Environment Variables

Add these to your Vercel environment variables:

```env
# Stripe Secret Key (Server-side)
STRIPE_SECRET_KEY=sk_live_... (or sk_test_... for testing)

# Stripe Publishable Key (Client-side)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_... (or pk_test_... for testing)

# Stripe Webhook Secret
STRIPE_WEBHOOK_SECRET=whsec_...
```

**Environment Settings**:
- `STRIPE_SECRET_KEY`: Production, Preview, Development
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`: Production, Preview, Development
- `STRIPE_WEBHOOK_SECRET`: Production, Preview (for testing)

## Step 8: Test Payment Flow

### Test Cards (Test Mode Only)

Stripe provides test cards for testing:

**Successful Payment**:
- Card: `4242 4242 4242 4242`
- Expiry: Any future date (e.g., `12/34`)
- CVC: Any 3 digits (e.g., `123`)
- ZIP: Any 5 digits (e.g., `12345`)

**Declined Payment**:
- Card: `4000 0000 0000 0002`

**Requires Authentication (3D Secure)**:
- Card: `4000 0027 6000 3184`

### Test Payment Process

1. Make a test booking on your site
2. Use test card `4242 4242 4242 4242`
3. Complete payment
4. Check Stripe Dashboard → **Payments** to see the transaction
5. Verify webhook was received (check webhook logs)

## Step 9: Go Live Checklist

Before accepting real payments:

- [ ] Business information completed
- [ ] Identity verification passed
- [ ] Bank account added for payouts
- [ ] Tax information provided
- [ ] Live API keys configured
- [ ] Webhook endpoint tested
- [ ] Payment methods enabled
- [ ] Test payments successful
- [ ] Refund process tested
- [ ] Customer support ready

## Important Notes

### Fees
- **Online payments**: 2.9% + $0.30 per transaction
- **In-person payments**: 2.7% + $0.05 per transaction
- **International cards**: +1% additional fee
- **Currency conversion**: 2% fee

### Payouts
- **Timing**: Usually 2-7 business days
- **Minimum**: No minimum (but $1 recommended)
- **Schedule**: Daily, weekly, or monthly

### Security
- ✅ Stripe is PCI-DSS Level 1 compliant
- ✅ Never store card details yourself
- ✅ Use Stripe.js for secure card collection
- ✅ Always use HTTPS
- ✅ Verify webhook signatures

### Fraud Prevention
- Stripe Radar automatically detects fraud
- Configure rules in **Settings** → **Radar** → **Rules**
- Monitor in **Payments** → **Disputes**

## Troubleshooting

### Payment Not Processing
- Check API keys are correct
- Verify webhook endpoint is accessible
- Check Stripe Dashboard for error messages
- Review webhook logs

### Webhook Not Receiving Events
- Verify webhook URL is correct
- Check webhook secret matches
- Ensure endpoint is publicly accessible
- Check webhook logs in Stripe Dashboard

### Test vs Live Mode
- Test mode: Use `pk_test_` and `sk_test_` keys
- Live mode: Use `pk_live_` and `sk_live_` keys
- Never mix test and live keys

## Next Steps

After Stripe setup is complete:
1. ✅ Save all API keys securely
2. ✅ Add to Vercel environment variables
3. ✅ Test payment flow
4. ✅ Verify webhooks work
5. ➡️ Proceed to Resend email setup

---

**Documentation**: https://stripe.com/docs
**Support**: https://support.stripe.com
**Status**: https://status.stripe.com

