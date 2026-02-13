# Bookify Payment & Email Flow - Complete Architecture

## 🔄 Complete Booking & Payment Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                      FRONTEND (Client)                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  RoomDetails.jsx                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ User fills in:                                          │    │
│  │ - Check-in date                                         │    │
│  │ - Check-out date                                        │    │
│  │ - Number of guests                                      │    │
│  │                                                          │    │
│  │ Click "Book Now"                                        │    │
│  └──────────────────┬──────────────────────────────────────┘    │
│                     │                                             │
│                     ├──► POST /api/bookings/book                 │
│                     │     (with Authorization header)            │
│                     ↓                                             │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Success Response                                         │   │
│  │ {                                                        │   │
│  │   success: true,                                        │   │
│  │   message: "Booking created successfully",             │   │
│  │   bookingId: "123456"                                   │   │
│  │ }                                                        │   │
│  └──────────────────┬──────────────────────────────────────┘   │
│                     │                                             │
│                     ↓                                             │
│  Navigate to /my-bookings                                        │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────────────┐
│                  BACKEND (Server)                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  bookingController.js - createBooking()                          │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ 1. Check room availability                              │    │
│  │ 2. Calculate total price                                │    │
│  │ 3. Create booking in database                           │    │
│  │    • status: "pending"                                  │    │
│  │    • isPaid: false                                      │    │
│  │ 4. Try to send confirmation email                       │    │
│  │    • If fails: Continue anyway (don't fail booking)     │    │
│  │ 5. Return success response                              │    │
│  └────────────────────────────────────────────────────────┘    │
│                     │                                             │
│                     ├──► Database (MongoDB)                      │
│                     │    Booking created                         │
│                     │                                             │
│                     ├──► Nodemailer/Brevo                        │
│                     │    ┌─────────────────────────────────┐    │
│                     │    │ Email Configuration:            │    │
│                     │    │ • Host: smtp-relay.brevo.com    │    │
│                     │    │ • Port: 587                     │    │
│                     │    │ • User: SMTP_USER              │    │
│                     │    │ • Pass: SMTP_PASS              │    │
│                     │    │ • From: SENDER_EMAIL           │    │
│                     │    └─────────────────────────────────┘    │
│                     │                                             │
│                     ↓                                             │
│              User Email Inbox                                     │
│              (Booking Confirmation)                              │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────────────┐
│                    FRONTEND (MyBookings)                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Display booking status: "Unpaid" (Red) ❌                       │
│  Show "Pay Now" button                                           │
│                                                                   │
│  User clicks "Pay Now"                                           │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ MyBookings.jsx - handlePayment()                         │   │
│  │ • POST /api/bookings/stripe-payment                      │   │
│  │ • Get stripe checkout URL                                │   │
│  │ • Redirect to Stripe                                     │   │
│  └──────────────────┬──────────────────────────────────────┘   │
│                     │                                             │
│                     ↓                                             │
│            Stripe Checkout Page                                   │
│            (User enters payment details)                          │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────────────┐
│                    STRIPE (Payment Gateway)                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  1. Process payment with test card                               │
│     • Card: 4242 4242 4242 4242 (test card)                     │
│     • Exp: Any future date                                       │
│     • CVC: Any 3-4 digits                                        │
│                                                                   │
│  2. Payment succeeds                                              │
│                                                                   │
│  3. Create checkout session with metadata:                       │
│     {                                                             │
│       metadata: {                                                │
│         bookingId: "123456"  ← From createBooking response      │
│       }                                                           │
│     }                                                             │
│                                                                   │
│  4. Send webhook event to backend                                │
│     Event type: "checkout.session.completed" ✅                  │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────────────┐
│                    BACKEND (Webhook Handler)                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  stripeWebhooks.js - stripeWebhooks()                            │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ 1. Receive webhook from Stripe                          │    │
│  │ 2. Validate signature with STRIPE_WEBHOOK_SECRET        │    │
│  │ 3. Check event type: "checkout.session.completed" ✅    │    │
│  │ 4. Extract bookingId from event.data.object.metadata    │    │
│  │ 5. Update booking in database:                          │    │
│  │    • isPaid: true                                       │    │
│  │    • status: "confirmed"  ← STATUS CHANGE! 🎉           │    │
│  │    • paymentMethod: "Stripe"                            │    │
│  │ 6. Return {received: true}                              │    │
│  └─────────────────────────────────────────────────────────┘    │
│                     │                                             │
│                     ├──► Database (MongoDB)                      │
│                     │    Booking updated                         │
│                     │    isPaid = true                           │
│                     │    status = "confirmed"                    │
│                     │                                             │
│                     ↓                                             │
│              SUCCESS! ✅                                         │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────────────┐
│                    FRONTEND (MyBookings)                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Redirect back to /my-bookings                                   │
│                                                                   │
│  Display booking status: "Paid" (Green) ✅                       │
│  "Pay Now" button is hidden                                      │
│                                                                   │
│  User can now proceed with hotel reservation                     │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📊 Database State Changes

### Before Booking
```javascript
// No booking exists
```

### After "Book Now" Clicked
```javascript
{
  _id: "ObjectId(...)",
  user: "user_clerk_id",
  room: "room_id",
  hotel: "hotel_id",
  checkInDate: "2024-12-25",
  checkOutDate: "2024-12-27",
  totalPrice: 400,
  guests: 2,
  status: "pending",           ← PENDING
  paymentMethod: "Pay At Hotel",
  isPaid: false,               ← NOT PAID
  createdAt: "2024-12-19T..."
}
```

### After Stripe Payment Confirmed
```javascript
{
  _id: "ObjectId(...)",
  user: "user_clerk_id",
  room: "room_id",
  hotel: "hotel_id",
  checkInDate: "2024-12-25",
  checkOutDate: "2024-12-27",
  totalPrice: 400,
  guests: 2,
  status: "confirmed",         ← CONFIRMED ✅
  paymentMethod: "Stripe",     ← CHANGED
  isPaid: true,                ← PAID ✅
  createdAt: "2024-12-19T..."
}
```

---

## 🔑 Environment Variables Used

### Stripe Configuration
```bash
STRIPE_PUBLISHABLE_KEY=pk_test_abc...  # Frontend uses this
STRIPE_SECRET_KEY=sk_test_xyz...       # Backend uses this
STRIPE_WEBHOOK_SECRET=whsec_123...     # Webhook validation
```

### Nodemailer Configuration
```bash
SENDER_EMAIL=noreply@bookify.com    # From email address
SMTP_USER=user@brevo.com            # SMTP username
SMTP_PASS=password_here             # SMTP password
```

---

## ✅ Key Fix Points

### What Was Wrong ❌
1. Webhook listening for `payment_intent.succeeded` (wrong event)
2. Trying to fetch session with incorrect API call
3. No status update to "confirmed"
4. Email sending error would fail entire booking

### What's Fixed ✅
1. Now listening for `checkout.session.completed` (correct event)
2. Getting session directly from event data
3. Updating status to "confirmed" on successful payment
4. Email errors don't cause booking creation to fail
5. Proper error handling and logging throughout

---

## 🧪 Testing the Flow

### Step 1: Create a Booking
```
1. Go to room details page
2. Fill in check-in, check-out, guests
3. Click "Book Now"
4. Confirm booking created with status: pending
```

### Step 2: Receive Confirmation Email
```
1. Check inbox for booking confirmation
2. Email should contain booking ID, hotel name, dates, total price
3. If not received, check spam folder
```

### Step 3: Make Payment
```
1. Go to My Bookings
2. See booking with "Unpaid" status
3. Click "Pay Now"
4. Enter test card: 4242 4242 4242 4242
5. Complete payment
```

### Step 4: Verify Payment Success
```
1. Check My Bookings page
2. Booking status should now be "Paid" ✅
3. "Pay Now" button should be hidden
4. Database should show isPaid: true, status: confirmed
```

---

## 🐛 Debugging Checklist

### If Payment Not Working
- [ ] Check STRIPE_SECRET_KEY (starts with sk_test_)
- [ ] Check server logs for Stripe API errors
- [ ] Check webhook signature validation in logs
- [ ] Check STRIPE_WEBHOOK_SECRET is correct
- [ ] Verify webhook URL in Stripe dashboard

### If Email Not Sending
- [ ] Check SMTP credentials in .env
- [ ] Check SENDER_EMAIL is verified in Brevo
- [ ] Check Brevo account is active
- [ ] Check server logs for SMTP errors
- [ ] Verify Brevo SMTP settings: smtp-relay.brevo.com:587

### If Status Not Updating
- [ ] Check webhook received payment event in server logs
- [ ] Verify database shows updated booking
- [ ] Check React component re-fetches bookings after payment
- [ ] Clear browser cache and reload page

---

## 📱 User Experience Timeline

```
T0:    User lands on hotel room page
T1:    User fills booking details
T2:    User clicks "Book Now"
T3:    Booking created, email sent
T4:    User sees "Unpaid" status in My Bookings
T5:    User clicks "Pay Now"
T6:    Redirected to Stripe checkout
T7:    User enters payment details
T8:    Payment processed by Stripe
T9:    Webhook received, booking updated
T10:   User redirected back to My Bookings
T11:   User sees "Paid" status ✅
T12:   Hotel owner sees confirmed booking in dashboard
```

---

## 🔐 Security Considerations

✅ Stripe handles payment security
✅ Webhook signature validated before processing
✅ API keys stored in environment variables
✅ No payment details stored locally
✅ Authorization middleware protects booking endpoints

See `STRIPE_NODEMAILER_SETUP.md` for detailed configuration instructions.
