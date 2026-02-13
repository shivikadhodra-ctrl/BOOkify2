# Bookify Setup Guide - Stripe & Nodemailer Configuration

## Overview
This guide explains how to properly configure Stripe payments and Nodemailer email notifications for the Bookify application.

---

## 1. Stripe Payment Setup

### What Stripe Does
- Handles secure payment processing when users click "Pay Now" on their bookings
- Updates booking status to "confirmed" when payment succeeds
- Integrates with checkout flow to verify payments

### Step-by-Step Configuration

#### 1.1 Get Stripe API Keys
1. Go to [Stripe Dashboard](https://dashboard.stripe.com/)
2. Sign in to your Stripe account (create one if needed)
3. Navigate to **Developers > API Keys**
4. You'll see two keys:
   - **Publishable Key**: Starts with `pk_test_` (used in frontend)
   - **Secret Key**: Starts with `sk_test_` (used in backend)

#### 1.2 Set Up Webhook
1. In Stripe Dashboard, go to **Developers > Webhooks**
2. Click **Add Endpoint**
3. Set the URL to: `https://yourdomain.com/api/stripe` (use actual domain)
4. Select events: **checkout.session.completed** and **payment_intent.succeeded**
5. Copy the **Signing Secret** (starts with `whsec_`)

#### 1.3 Update .env File
```
STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
STRIPE_SECRET_KEY=sk_test_your_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

### How It Works

**Frontend Flow (MyBookings.jsx):**
1. User clicks "Pay Now" button
2. Frontend calls `/api/bookings/stripe-payment` endpoint
3. Backend creates Stripe checkout session
4. Frontend redirects to Stripe checkout page
5. User completes payment on Stripe
6. Stripe redirects back to success URL

**Backend Webhook Flow (stripeWebhooks.js):**
1. Stripe sends webhook event when payment completes
2. Webhook handler validates the event with secret key
3. Booking is marked as `isPaid: true` and `status: confirmed`
4. Email confirmation is sent to user

---

## 2. Nodemailer Email Setup

### What Nodemailer Does
- Sends booking confirmation emails when user creates a booking
- Uses SMTP relay to send emails securely
- Integrates with Brevo (formerly Sendinblue) for email delivery

### Step-by-Step Configuration

#### 2.1 Set Up Brevo Account
1. Go to [Brevo](https://www.brevo.com/) and sign up
2. Click **SMTP & API > SMTP Tab**
3. You'll see SMTP credentials:
   - **SMTP Server**: smtp-relay.brevo.com
   - **Port**: 587
   - **Login**: Your Brevo account email
   - **Password**: Get from SMTP settings (click "Show")

#### 2.2 Get Sender Email
- Use an email verified in your Brevo account
- Can be your personal email or a noreply address
- Must be verified in Brevo to send emails

#### 2.3 Update .env File
```
SENDER_EMAIL=your_verified_email@gmail.com
SMTP_USER=your_brevo_login_email
SMTP_PASS=your_brevo_smtp_password
```

### How It Works

**Booking Creation Flow (bookingController.js):**
1. User clicks "Book Now" in RoomDetails page
2. Booking is created with `status: pending` and `isPaid: false`
3. Email is sent with booking details
4. User sees "Unpaid" status in My Bookings page
5. User can click "Pay Now" to proceed with Stripe payment

**After Payment:**
1. Stripe webhook confirms payment
2. Booking status changes to `confirmed`
3. `isPaid` becomes `true`
4. User sees "Paid" status in My Bookings page

---

## 3. Troubleshooting

### Payment Not Working
- **Check**: STRIPE_SECRET_KEY is correct (starts with `sk_test_`)
- **Check**: STRIPE_WEBHOOK_SECRET is set correctly
- **Check**: Webhook URL matches your domain
- **Check**: Browser console for error messages
- **Check**: Backend logs for webhook errors

### Emails Not Sending
- **Check**: SENDER_EMAIL is verified in Brevo
- **Check**: SMTP_USER and SMTP_PASS are correct
- **Check**: Brevo account is active and not blocked
- **Check**: Backend logs for SMTP errors
- **Check**: Email not in spam folder

### Booking Status Issues
- **Issue**: Booking stuck on "Unpaid"
  - **Solution**: Make payment through Stripe
  - **Check**: Webhook is receiving payment confirmation

- **Issue**: Status showing "pending"
  - **Normal**: Status is "pending" until payment received
  - **After Payment**: Should change to "confirmed"

### Common .env Errors
```
ERROR: Invalid Stripe keys
- Check that STRIPE_SECRET_KEY starts with 'sk_test_' or 'sk_live_'
- Check that STRIPE_PUBLISHABLE_KEY starts with 'pk_test_' or 'pk_live_'

ERROR: Webhook Error: No signatures found matching expected signature
- Check that STRIPE_WEBHOOK_SECRET is correct
- Webhook secret is different from API secret key

ERROR: Mail command failed
- Check SMTP credentials are correct
- Check SENDER_EMAIL is verified in Brevo
- Check internet connection is stable
```

---

## 4. Testing

### Test Payment Flow
1. Make sure Stripe is in **test mode** (not live)
2. Use test card: `4242 4242 4242 4242`
3. Use any future expiry date and any CVC
4. Create a booking and click "Pay Now"
5. Complete payment on Stripe
6. Check if booking status changes to "Paid"

### Test Email Flow
1. Create a booking without payment
2. Check inbox for booking confirmation email
3. If not received, check spam folder
4. Check backend logs for SMTP errors

---

## 5. Environment Variables Checklist

- [ ] MONGODB_URI - MongoDB connection string
- [ ] CLOUDINARY_CLOUD_NAME - Cloudinary account name
- [ ] CLOUDINARY_API_KEY - Cloudinary API key
- [ ] CLOUDINARY_API_SECRET - Cloudinary API secret
- [ ] CLERK_PUBLISHABLE_KEY - Clerk auth public key
- [ ] CLERK_SECRET_KEY - Clerk auth secret key
- [ ] CLERK_WEBHOOK_SECRET - Clerk webhook secret
- [ ] STRIPE_PUBLISHABLE_KEY - Stripe public key (pk_test_...)
- [ ] STRIPE_SECRET_KEY - Stripe secret key (sk_test_...)
- [ ] STRIPE_WEBHOOK_SECRET - Stripe webhook secret (whsec_...)
- [ ] SENDER_EMAIL - Verified email in Brevo
- [ ] SMTP_USER - Brevo SMTP username
- [ ] SMTP_PASS - Brevo SMTP password

---

## 6. Deployment Notes

When deploying to production:
1. Update STRIPE keys to live keys (pk_live_, sk_live_)
2. Update webhook URL to production domain
3. Verify SENDER_EMAIL for production
4. Keep secrets secure (never commit .env file)
5. Use environment variables from hosting platform
6. Test payment flow again in production

---

## 7. Code Changes Made

### Fixed Issues:
1. ✅ Stripe webhook now handles `checkout.session.completed` event
2. ✅ Booking status updated to "confirmed" after successful payment
3. ✅ Email error handling improved (won't fail booking if email fails)
4. ✅ Webhook signature verification error handling
5. ✅ Console logging for debugging
6. ✅ Better email template with all booking details

### Files Modified:
- `server/controllers/stripeWebhooks.js` - Fixed webhook handler
- `server/controllers/bookingController.js` - Improved email sending and error handling
- `server/.env.example` - Created template with correct format

---

For questions or issues, check browser console logs and backend terminal output for detailed error messages.
