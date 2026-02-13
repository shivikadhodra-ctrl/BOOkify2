# ✅ Bookify Implementation Checklist

## 🎯 Overview
This checklist guides you through getting Stripe and Nodemailer working in your Bookify application.

---

## Phase 1: Understanding the Issues ✅ DONE

- [x] Identified Stripe webhook was listening for wrong event
- [x] Found Nodemailer credentials missing from .env
- [x] Found Stripe API keys in wrong format
- [x] Identified booking status not updating after payment
- [x] Found frontend Stripe integration was correct

---

## Phase 2: Backend Code Fixes ✅ DONE

- [x] Fixed stripeWebhooks.js to handle correct event type
- [x] Added status update to "confirmed" on successful payment
- [x] Improved email error handling in bookingController.js
- [x] Added proper logging for debugging
- [x] Added webhook signature verification

### Files Modified:
- [x] `server/controllers/stripeWebhooks.js` - Fixed webhook handler
- [x] `server/controllers/bookingController.js` - Improved email flow
- [x] `server/.env.example` - Created template

---

## Phase 3: Documentation ✅ DONE

- [x] Created `STRIPE_NODEMAILER_SETUP.md` - Detailed setup guide
- [x] Created `ISSUES_AND_FIXES_SUMMARY.md` - What was fixed
- [x] Created `PAYMENT_FLOW_DIAGRAM.md` - Visual architecture
- [x] Created `QUICK_SETUP.sh` - Quick reference guide
- [x] Created `.env.example` - Configuration template

---

## Phase 4: Your Configuration Tasks ⏳ TODO

### 4.1 Stripe Setup
- [ ] Create Stripe account if you don't have one: https://stripe.com
- [ ] Go to Stripe Dashboard: https://dashboard.stripe.com
- [ ] Navigate to Developers > API Keys
- [ ] Copy Publishable Key (starts with `pk_test_`)
- [ ] Copy Secret Key (starts with `sk_test_`)
- [ ] Navigate to Developers > Webhooks
- [ ] Click "Add Endpoint"
- [ ] Enter URL: `https://yourdomain.com/api/stripe`
- [ ] Select event: `checkout.session.completed`
- [ ] Copy Signing Secret (starts with `whsec_`)
- [ ] Update `.env` file:
  ```env
  STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_KEY
  STRIPE_SECRET_KEY=sk_test_YOUR_KEY
  STRIPE_WEBHOOK_SECRET=whsec_YOUR_SECRET
  ```

### 4.2 Nodemailer (Brevo) Setup
- [ ] Create Brevo account: https://www.brevo.com
- [ ] Verify your email address in Brevo
- [ ] Go to Settings > SMTP & API > SMTP
- [ ] Note down: SMTP Server, Port, Login credentials
- [ ] Get SMTP password from settings
- [ ] Update `.env` file:
  ```env
  SENDER_EMAIL=your_verified_email@example.com
  SMTP_USER=your_brevo_login_email
  SMTP_PASS=your_brevo_smtp_password
  ```

### 4.3 Verify Configuration
- [ ] Open `server/.env` file
- [ ] Check all Stripe keys are filled in (not `#---` placeholders)
- [ ] Check all Nodemailer credentials are filled in
- [ ] Check no sensitive info is exposed
- [ ] Verify format matches `.env.example`

---

## Phase 5: Testing ⏳ TODO

### 5.1 Setup Testing Environment
- [ ] Start MongoDB server locally or connect to cloud DB
- [ ] Install server dependencies: `cd server && npm install`
- [ ] Install client dependencies: `cd client && npm install`
- [ ] Start server: `npm run dev`
- [ ] Start client: `npm run dev`

### 5.2 Test Booking Creation
- [ ] Open application in browser
- [ ] Navigate to a hotel room
- [ ] Fill in booking details (dates, guests)
- [ ] Click "Book Now"
- [ ] Confirm booking appears in database
- [ ] Verify booking status is "pending" and isPaid is false

### 5.3 Test Email Sending
- [ ] Check your email inbox for booking confirmation
- [ ] Verify email contains:
  - [x] Booking ID
  - [x] Hotel name and location
  - [x] Check-in and check-out dates
  - [x] Total amount
  - [x] Number of guests
  - [x] Current status
- [ ] If email not received:
  - [ ] Check spam folder
  - [ ] Check server logs for SMTP errors
  - [ ] Verify SENDER_EMAIL is verified in Brevo
  - [ ] Verify SMTP credentials are correct

### 5.4 Test Stripe Payment
- [ ] Go to My Bookings page
- [ ] See booking with "Unpaid" status (red indicator)
- [ ] Click "Pay Now" button
- [ ] Verify redirect to Stripe checkout page
- [ ] Use test card: `4242 4242 4242 4242`
- [ ] Use any future expiry date (e.g., 12/25)
- [ ] Use any 3-4 digit CVC (e.g., 123)
- [ ] Complete payment
- [ ] Check redirect back to My Bookings

### 5.5 Test Payment Success
- [ ] Verify booking status changed to "Paid" (green indicator)
- [ ] Verify "Pay Now" button is hidden
- [ ] Check database shows:
  - [ ] isPaid: true
  - [ ] status: "confirmed"
  - [ ] paymentMethod: "Stripe"
- [ ] Check server logs for webhook received message
- [ ] Check no errors in webhook processing

---

## Phase 6: Deployment Preparation ⏳ TODO

### 6.1 Production Stripe Setup
- [ ] Switch Stripe dashboard to Live Mode
- [ ] Get live API keys (starts with `pk_live_` and `sk_live_`)
- [ ] Update webhook to production domain
- [ ] Get new signing secret for production
- [ ] Update `.env` with live keys (NOT test keys)

### 6.2 Production Email Setup
- [ ] Set up SPF and DKIM records for sender domain
- [ ] Verify production sender email in Brevo
- [ ] Update SENDER_EMAIL in production .env

### 6.3 Security Checklist
- [ ] Never commit `.env` file to git
- [ ] Use environment variables from hosting platform
- [ ] Rotate SMTP password periodically
- [ ] Monitor webhook delivery status in Stripe dashboard
- [ ] Set up error monitoring and alerting

### 6.4 Deployment Steps
- [ ] Push code to production branch
- [ ] Set environment variables on hosting platform
- [ ] Restart production server
- [ ] Test payment flow in production
- [ ] Monitor logs for any errors

---

## Phase 7: Monitoring & Maintenance ⏳ TODO

- [ ] Monitor Stripe webhook deliveries (dashboard > Webhooks)
- [ ] Monitor email delivery (Brevo > Activity)
- [ ] Set up alerts for failed transactions
- [ ] Review logs weekly for errors
- [ ] Test payment flow monthly
- [ ] Keep dependencies updated
- [ ] Monitor API usage on both Stripe and Brevo

---

## ❓ Troubleshooting

### Problem: "Webhook Error: No signatures found"
**Solution**: Check STRIPE_WEBHOOK_SECRET is correct. Should start with `whsec_`

### Problem: "ECONNREFUSED" for SMTP
**Solution**: Check SMTP credentials are correct. Host should be `smtp-relay.brevo.com` port `587`

### Problem: Email sending fails silently
**Solution**: 
1. Check SENDER_EMAIL is verified in Brevo
2. Check SMTP_USER is your Brevo login email
3. Check server logs for detailed error

### Problem: Payment status not updating
**Solution**:
1. Check webhook received in server logs
2. Verify webhook signature with STRIPE_WEBHOOK_SECRET
3. Check booking ID is correct in session metadata
4. Restart server and try again

### Problem: Test card doesn't work
**Solution**:
- Use test card: `4242 4242 4242 4242`
- Use any future expiry date
- Use any 3-4 digit CVC
- Use test API keys, not live keys

---

## 📊 Current Status

### ✅ Completed
- Backend webhook handler fixed
- Email error handling improved
- Documentation created
- Code ready for deployment

### ⏳ Pending Your Action
- Stripe account setup
- Stripe API keys configuration
- Brevo account setup
- Email credentials configuration
- Testing the complete flow
- Deployment to production

---

## 🔗 Quick Links

- [Stripe Dashboard](https://dashboard.stripe.com)
- [Stripe API Keys](https://dashboard.stripe.com/apikeys)
- [Stripe Webhooks](https://dashboard.stripe.com/webhooks)
- [Stripe Test Cards](https://stripe.com/docs/testing)
- [Brevo](https://www.brevo.com)
- [Brevo SMTP Settings](https://app.brevo.com/settings/smtp-api)

---

## 📋 Help Resources

1. **Setup Guide**: See `STRIPE_NODEMAILER_SETUP.md`
2. **Issues Fixed**: See `ISSUES_AND_FIXES_SUMMARY.md`
3. **Payment Flow**: See `PAYMENT_FLOW_DIAGRAM.md`
4. **Quick Reference**: See `QUICK_SETUP.sh`

---

## ✨ Next Steps

1. Read `STRIPE_NODEMAILER_SETUP.md` to understand the setup
2. Go to Stripe and Brevo dashboards to get credentials
3. Update `.env` file with your credentials
4. Test the complete flow
5. Deploy to production

---

**Last Updated**: December 19, 2024
**Status**: Code fixed, waiting for your configuration
**Estimated Setup Time**: 30 minutes
