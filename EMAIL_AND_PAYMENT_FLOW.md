# 📧 Email Flow - Detailed Explanation

## When Does Nodemailer Send Email?

**Answer: Immediately after "Book Now" is clicked, BEFORE payment**

---

## 📧 Email Sending Flow

### Step 1: User Clicks "Book Now"

**Frontend: RoomDetails.jsx**
```javascript
const onSubmitHandler = async (e) => {
  const { data } = await axios.post('/api/bookings/book', {
    room: id,
    checkInDate: checkInDate,
    checkOutDate: checkOutDate,
    guests: guests,
  }, {
    headers: { Authorization: `Bearer ${await getToken()}` }
  });
};
```

Sends to: `POST /api/bookings/book`

---

### Step 2: Backend Receives Booking Request

**Backend: bookingController.js**
```javascript
export const createBooking = async (req, res) => {
  // 1. Check availability
  // 2. Get room data
  // 3. Calculate price
  // 4. Create booking in database
  // 5. SEND EMAIL ← HERE
  // 6. Return response
};
```

---

### Step 3: Email Configuration

**File: server/configs/nodemailer.js**
```javascript
import nodemailer from 'nodemailer';

// Setup SMTP transporter
const transporter = nodemailer.createTransport({
    host: 'smtp-relay.brevo.com',    // Brevo SMTP server
    port: 587,                        // Standard SMTP port (TLS)
    auth: {
        user: process.env.SMTP_USER,  // Your Brevo login email
        pass: process.env.SMTP_PASS,  // Your Brevo SMTP password
    },
});

export default transporter;
```

---

### Step 4: Email Content Prepared

**Backend: bookingController.js**
```javascript
const mailOptions = {
  from: process.env.SENDER_EMAIL,  // noreply@bookify.com
  to: req.user.email,              // customer@gmail.com
  subject: 'Hotel Booking Confirmation - Bookify',
  html: `
    <h2>Your Booking Details</h2>
    <p>Dear ${req.user.username},</p>
    <p>Thank you for your booking!</p>
    <ul>
      <li><strong>Booking ID:</strong> ${booking._id}</li>
      <li><strong>Hotel Name:</strong> ${roomData.hotel.name}</li>
      <li><strong>Location:</strong> ${roomData.hotel.address}</li>
      <li><strong>Check-In Date:</strong> ${new Date(booking.checkInDate).toDateString()}</li>
      <li><strong>Check-Out Date:</strong> ${new Date(booking.checkOutDate).toDateString()}</li>
      <li><strong>Total Amount:</strong> ${process.env.CURRENCY || '$'}${booking.totalPrice}</li>
      <li><strong>Number of Guests:</strong> ${booking.guests}</li>
      <li><strong>Status:</strong> ${booking.status}</li>
    </ul>
    <p>Please proceed to payment to confirm your reservation.</p>
    <p>Best regards, Bookify Team</p>
  `,
};
```

---

### Step 5: Email Sent via Nodemailer

**Backend: bookingController.js**
```javascript
try {
  // Send email using Nodemailer/Brevo
  await transporter.sendMail(mailOptions);
  console.log("Booking confirmation email sent to:", req.user.email);
} catch (emailError) {
  // Email failed, but booking still created
  console.error("Failed to send email:", emailError.message);
  // Continue anyway - don't fail the booking
}
```

---

## 🔄 Complete Email + Payment Timeline

```
T=0min: User clicks "Book Now"
  ↓
T=1sec: Booking created in database
  ├─ status: "pending"
  ├─ isPaid: false
  └─ totalPrice: ₹10000
  ↓
T=2sec: Email preparation
  ├─ Gets recipient: customer@gmail.com
  ├─ Gets hotel: Taj Mahal Resort
  ├─ Gets dates: Dec 25-27, 2024
  ├─ Gets amount: ₹10000
  └─ Gets booking ID: booking_111
  ↓
T=3sec: Email sent via Brevo SMTP
  ├─ Nodemailer connects to: smtp-relay.brevo.com:587
  ├─ Authenticates with: SMTP_USER / SMTP_PASS
  ├─ Sends from: SENDER_EMAIL
  ├─ Sends to: customer@gmail.com
  └─ Email arrives in inbox (usually within 1 minute)
  ↓
T=4sec: Response sent to frontend
  ├─ success: true
  ├─ message: "Booking created successfully"
  └─ bookingId: "booking_111"
  ↓
T=5sec: Customer redirected to My Bookings
  ├─ Sees booking with "Unpaid" status
  ├─ Sees "Pay Now" button
  └─ Sees email in inbox

=== CUSTOMER NOW PAYS (minutes/hours later) ===

T=+5min: Customer clicks "Pay Now"
  ↓
T=+6min: Stripe checkout page loads
  ├─ Amount: $100 (₹10000)
  ├─ Product: Taj Mahal Resort
  └─ Booking ID in metadata
  ↓
T=+10min: Customer completes payment
  ↓
T=+11min: Stripe processes payment ✓
  ↓
T=+12min: Webhook sent to backend
  ├─ Type: "checkout.session.completed"
  ├─ Contains: bookingId from metadata
  └─ Received at: /api/stripe
  ↓
T=+13min: Booking updated in database
  ├─ isPaid: true
  ├─ status: "confirmed"
  └─ paymentMethod: "Stripe"
  ↓
T=+14min: Customer redirected to My Bookings
  └─ Sees "Paid" status ✅
```

---

## 🔐 Email Authentication Setup

### What You Need in .env

```env
# Brevo SMTP Credentials
SENDER_EMAIL=noreply@bookify.com      # Must be verified in Brevo
SMTP_USER=your_brevo_login@gmail.com  # Your Brevo account email
SMTP_PASS=your_brevo_smtp_password    # Get from Brevo SMTP settings
```

---

## 📬 Email Service (Brevo) Explained

### Brevo Overview
- **What it is**: SMTP email relay service
- **Cost**: Free tier available (300 emails/day)
- **Used by**: Nodemailer to send emails
- **Server**: smtp-relay.brevo.com:587

### How It Works

```
Your Application
     ↓
Nodemailer (Node.js library)
     ↓
Brevo SMTP Server (smtp-relay.brevo.com:587)
     ↓
Customer's Email Provider (Gmail, Outlook, etc.)
     ↓
Customer's Inbox
```

### Setup Steps

1. **Create Brevo Account**
   - Go to https://www.brevo.com
   - Sign up with email
   - Verify email

2. **Get SMTP Credentials**
   - Login to Brevo
   - Go to Settings → SMTP & API
   - Get:
     - SMTP Server: smtp-relay.brevo.com
     - Port: 587
     - Login: Your Brevo email
     - Password: Your SMTP password

3. **Verify Sender Email**
   - In Brevo, add sender email
   - Verify ownership
   - Use in SENDER_EMAIL

---

## ✅ Complete Email Example

### Booking Details
```
Hotel: Taj Mahal Resort
Room: Deluxe Suite
Check-In: Dec 25, 2024
Check-Out: Dec 27, 2024
Guests: 2
Total: ₹10,000
```

### Email Received (HTML formatted)

```
From: noreply@bookify.com
To: customer@gmail.com
Subject: Hotel Booking Confirmation - Bookify

═════════════════════════════════════════════════════

         Your Booking Details

Dear customer,

Thank you for your booking! Here are your details:

• Booking ID: 507f1f77bcf86cd799439011
• Hotel Name: Taj Mahal Resort
• Location: Agra, India
• Check-In Date: Tue Dec 25 2024
• Check-Out Date: Thu Dec 27 2024
• Total Amount: ₹10,000
• Number of Guests: 2
• Status: pending

Please proceed to payment to confirm your reservation.

Best regards,
Bookify Team

═════════════════════════════════════════════════════
```

---

## 🔗 Email & Payment Relationship

### Timeline

```
Email Sent: IMMEDIATELY after "Book Now"
  ✓ Booking created
  ✓ Email sent
  ✓ Status: pending
  ✓ isPaid: false
  
  Customer Can:
  - View email
  - See booking details
  - Decide to pay later

Payment: ANY TIME (minutes/hours/days later)
  Customer clicks "Pay Now"
  ✓ Stripe payment
  ✓ Webhook confirmation
  ✓ Status updated: confirmed
  ✓ isPaid: true
```

### Key Point
- **Email is NOT sent after payment**
- **Email is sent immediately after booking is created**
- **Payment updates booking status, not send new email**

---

## 🐛 Troubleshooting Email Issues

### Issue 1: Email Not Received

**Check 1: Credentials**
```javascript
// In server logs, should see:
"Booking confirmation email sent to: customer@gmail.com"

// If this doesn't appear:
- Check SENDER_EMAIL is set
- Check SMTP_USER is set
- Check SMTP_PASS is set
```

**Check 2: Brevo Account**
```javascript
// Verify in Brevo dashboard:
- SENDER_EMAIL is verified
- Account not blocked
- Free tier quota not exceeded
```

**Check 3: Email Delivery**
```javascript
// Check in Brevo Activity logs:
- Email shows as "sent"
- No bounces or blocks
- Recipient address correct
```

### Issue 2: Email in Spam

**Solution:**
1. Check spam folder in Gmail/Outlook
2. Mark as "Not Spam"
3. Configure SPF/DKIM records:
   - Contact your domain registrar
   - Add Brevo SPF record
   - Add Brevo DKIM record

### Issue 3: SMTP Connection Error

**Error:** "ECONNREFUSED: smtp-relay.brevo.com:587"

**Solution:**
```javascript
// Check in .env:
// 1. SMTP credentials are correct
// 2. Server name: smtp-relay.brevo.com
// 3. Port: 587 (not 25 or 465)
// 4. TLS enabled (standard)
```

### Issue 4: Email Fails, Booking Also Fails

**This Should NOT Happen (Fixed)**

With the fix:
```javascript
try {
  await transporter.sendMail(mailOptions);
} catch (emailError) {
  console.error("Failed to send email:", emailError.message);
  // Booking is NOT failed
}

res.json({ success: true, ... });  // Still returns success
```

---

## 📊 Email Status Tracking

### Brevo Dashboard

In Brevo, you can track:

```
Activity → Email Logs

Email 1:
- To: customer1@gmail.com
- Subject: Hotel Booking Confirmation
- Status: Delivered ✓
- Time: 2024-12-19 10:15:23

Email 2:
- To: customer2@outlook.com
- Subject: Hotel Booking Confirmation
- Status: Opened ✓ (1.5 hours later)
- Time: 2024-12-19 10:16:45

Email 3:
- To: customer3@yahoo.com
- Subject: Hotel Booking Confirmation
- Status: Bounced ✗ (invalid address)
- Time: 2024-12-19 10:17:12
```

---

## 🔄 Payment Doesn't Trigger New Email

### After Stripe Payment

**What DOES happen:**
```javascript
// In webhook handler
await Booking.findByIdAndUpdate(bookingId, {
  isPaid: true,
  status: "confirmed"
});
// ↓ Only booking updated, no email sent
```

**What DOESN'T happen:**
```javascript
// This is NOT in the code
// Email is NOT sent again on payment
await transporter.sendMail(paymentConfirmationEmail);
// ↑ This doesn't exist in webhook handler
```

**If you want payment confirmation email:**
- You would need to add it to the webhook handler
- Currently: Booking confirmation only

---

## 💡 Best Practices

### 1. Email Content
- ✅ Include booking ID
- ✅ Include hotel details
- ✅ Include dates
- ✅ Include total amount
- ✅ Clear next steps (payment)

### 2. Email Timing
- ✅ Send immediately (before payment)
- ✅ While details are fresh
- ✅ Gives customer info to refer back to

### 3. Email Reliability
- ✅ Wrap in try-catch
- ✅ Don't fail booking if email fails
- ✅ Log errors for debugging
- ✅ Use trusted SMTP provider

### 4. Email Compliance
- ✅ Include unsubscribe link (if applicable)
- ✅ Use professional email address
- ✅ Include company name and address
- ✅ Don't send to invalid addresses

---

## 🎯 Summary

| Event | Email Sent? | Status | Details |
|-------|------------|--------|---------|
| User clicks "Book Now" | ✅ YES | pending | Confirmation email |
| Check dates | ❌ NO | pending | Just validation |
| Check availability | ❌ NO | pending | Just validation |
| Booking created | ✅ YES | pending | Same as "Book Now" |
| User sees "Unpaid" | ❌ NO | pending | No email triggered |
| User clicks "Pay Now" | ❌ NO | pending | Redirects to Stripe |
| Payment processed | ❌ NO | confirmed | No email sent (currently) |
| Status updates | ❌ NO | confirmed | Webhook updates DB only |
| User sees "Paid" | ❌ NO | confirmed | No email triggered |

---

## 📧 Example Booking Confirmation Email

**Sent To:** customer@gmail.com  
**Sent From:** noreply@bookify.com  
**Sent Via:** Brevo SMTP Relay  
**Sent When:** Immediately after booking (before payment)

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃                                                     ┃
┃        BOOKIFY - HOTEL BOOKING CONFIRMATION        ┃
┃                                                     ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

Dear Rajesh Kumar,

Thank you for your booking! Your reservation has been confirmed.
Here are the details:

BOOKING INFORMATION
───────────────────────────────────────────────────────
Booking ID              507f1f77bcf86cd799439011
Booking Status          Pending (Awaiting Payment)

HOTEL DETAILS
───────────────────────────────────────────────────────
Hotel Name              Taj Mahal Resort
Location                Agra, India
Room Type               Deluxe Suite
Number of Guests        2

DATES
───────────────────────────────────────────────────────
Check-In                Tuesday, December 25, 2024
Check-Out               Thursday, December 27, 2024
Number of Nights        2

PRICING
───────────────────────────────────────────────────────
Price per Night         ₹5,000
Number of Nights        2
Total Amount            ₹10,000

NEXT STEPS
───────────────────────────────────────────────────────
Please complete your payment to confirm the booking.
You can proceed to payment in your My Bookings page.

QUESTIONS?
───────────────────────────────────────────────────────
If you have any questions about your booking, please
don't hesitate to contact us.

Warm regards,
The Bookify Team

Note: This is an automated email. Please do not reply.

┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
```

---

**Key Takeaway**: Email sent IMMEDIATELY after booking, BEFORE payment. Payment doesn't trigger new email (currently).
