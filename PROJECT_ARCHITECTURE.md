# 🏗️ Bookify Project Structure & Architecture

## Complete Project Overview

```
Bookify/
├── 📁 client/                          (React Frontend)
│   ├── src/
│   │   ├── 📁 pages/
│   │   │   ├── Home.jsx                ← Landing page with hotels
│   │   │   ├── RoomDetails.jsx         ← Room details + booking form
│   │   │   ├── MyBookings.jsx          ← User's bookings + payment
│   │   │   └── AllRooms.jsx            ← Browse all rooms
│   │   │
│   │   ├── 📁 components/
│   │   │   ├── Hero.jsx                ← Banner section
│   │   │   ├── RecommendedHotels.jsx   ← Display all hotels
│   │   │   ├── Navbar.jsx              ← Top navigation
│   │   │   ├── HotelCard.jsx           ← Hotel display card
│   │   │   ├── Testimonial.jsx         ← Reviews section
│   │   │   └── 📁 hotelOwner/
│   │   │       ├── Dashboard.jsx       ← Hotel owner dashboard
│   │   │       ├── ListRoom.jsx        ← Room list for owner
│   │   │       ├── AddRoom.jsx         ← Add new room form
│   │   │       └── Navbar.jsx          ← Owner navigation
│   │   │
│   │   ├── 📁 context/
│   │   │   └── AppContext.jsx          ← Global state management
│   │   │
│   │   ├── App.jsx                     ← Main app component
│   │   ├── main.jsx                    ← Entry point
│   │   └── index.css                   ← Global styles
│   │
│   └── package.json                    ← Frontend dependencies
│
├── 📁 server/                          (Node.js/Express Backend)
│   ├── 📁 controllers/                 (Business Logic)
│   │   ├── bookingController.js        ← Booking logic
│   │   │   ├── createBooking()         ← Create new booking (with email)
│   │   │   ├── stripePayment()         ← Create Stripe session
│   │   │   ├── getUserBookings()       ← Get user's bookings
│   │   │   └── getHotelBookings()      ← Get hotel owner's bookings
│   │   │
│   │   ├── stripeWebhooks.js           ← Stripe webhook handler ✅ FIXED
│   │   │   └── stripeWebhooks()        ← Process payment confirmation
│   │   │
│   │   ├── hotelController.js          ← Hotel management
│   │   │   ├── registerHotel()         ← Create new hotel
│   │   │   └── getAllHotels()          ← List all hotels
│   │   │
│   │   ├── roomController.js           ← Room management
│   │   │   ├── createRoom()            ← Add room to hotel
│   │   │   └── getRooms()              ← Get hotel's rooms
│   │   │
│   │   └── clerkWebhooks.js            ← Auth webhook handler
│   │
│   ├── 📁 routes/                      (API Endpoints)
│   │   ├── bookingRoutes.js            ← /api/bookings/*
│   │   ├── hotelRoutes.js              ← /api/hotels/*
│   │   ├── roomRoutes.js               ← /api/rooms/*
│   │   └── userRoutes.js               ← /api/user/*
│   │
│   ├── 📁 models/                      (Database Schemas)
│   │   ├── User.js                     ← User schema (Clerk auth)
│   │   ├── Hotel.js                    ← Hotel schema
│   │   ├── Room.js                     ← Room schema
│   │   └── Booking.js                  ← Booking schema
│   │
│   ├── 📁 configs/                     (Configuration Files)
│   │   ├── db.js                       ← MongoDB connection
│   │   ├── nodemailer.js               ← Email setup ✅ FIXED
│   │   └── cloudinary.js               ← Image upload setup
│   │
│   ├── 📁 middleware/                  (Request Processors)
│   │   ├── authMiddleware.js           ← JWT verification
│   │   └── uploadMiddleware.js         ← File upload handling
│   │
│   ├── server.js                       ← Main server file
│   └── package.json                    ← Backend dependencies
│
├── 📄 COMPLETE_USER_JOURNEY.md         ← User flow (CREATED)
├── 📄 EMAIL_AND_PAYMENT_FLOW.md        ← Email & payment (CREATED)
├── 📄 00_START_HERE.md                 ← Start here guide (CREATED)
├── 📄 STRIPE_NODEMAILER_SETUP.md       ← Setup guide (CREATED)
├── 📄 BEFORE_AND_AFTER.md              ← Code fixes (CREATED)
├── 📄 PAYMENT_FLOW_DIAGRAM.md          ← Architecture (CREATED)
├── 📄 IMPLEMENTATION_CHECKLIST.md      ← Tasks (CREATED)
├── 📄 ISSUES_AND_FIXES_SUMMARY.md      ← Issues (CREATED)
├── 📄 DOCUMENTATION_INDEX.md           ← Doc guide (CREATED)
├── 📄 README_FIXES.md                  ← Summary (CREATED)
├── 📄 QUICK_SETUP.sh                   ← Quick ref (CREATED)
└── 📄 .env.example                     ← Config template (CREATED)
```

---

## 🔄 Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      FRONTEND (React)                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  User Interface Components:                                 │
│  ├─ Home.jsx (Landing)                                      │
│  ├─ RoomDetails.jsx (Booking form)                          │
│  ├─ MyBookings.jsx (Payment)                                │
│  └─ Dashboard.jsx (Hotel owner view)                        │
│                                                              │
│  Global State (AppContext.jsx):                             │
│  ├─ User (from Clerk)                                       │
│  ├─ Rooms list                                              │
│  ├─ Hotels list                                             │
│  └─ Auth token                                              │
│                                                              │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTP/HTTPS Requests
                         ↓
┌─────────────────────────────────────────────────────────────┐
│                      BACKEND (Node.js)                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  API Routes:                                                │
│  ├─ POST /api/bookings/book          (Create booking)       │
│  │  └─ Creates booking & sends email via Nodemailer        │
│  ├─ POST /api/bookings/stripe-payment (Stripe session)      │
│  │  └─ Generates Stripe checkout URL                       │
│  ├─ GET /api/bookings/user           (Get user bookings)    │
│  ├─ POST /api/hotels                 (Register hotel)       │
│  ├─ POST /api/rooms                  (Add room)             │
│  └─ POST /api/stripe                 (Webhook endpoint) ✅  │
│     └─ Updates booking when payment confirmed               │
│                                                              │
│  Database Layer:                                             │
│  ├─ MongoDB Collections:                                    │
│  │  ├─ users                                                │
│  │  ├─ hotels                                               │
│  │  ├─ rooms                                                │
│  │  └─ bookings                                             │
│                                                              │
│  External Services:                                         │
│  ├─ Clerk (Authentication)                                  │
│  ├─ Cloudinary (Image storage)                              │
│  ├─ Stripe (Payment processing) ✅                          │
│  └─ Brevo/Nodemailer (Email sending) ✅                     │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 👥 User Roles & Permissions

### 1. Regular Customer

**Account Created By**: Self-signup via Clerk

**Can Do**:
- ✅ View all hotels
- ✅ View all rooms
- ✅ Book any room (with available dates)
- ✅ Make payment for bookings
- ✅ View own bookings

**Cannot Do**:
- ❌ Register hotel
- ❌ Add rooms
- ❌ View other users' bookings
- ❌ Manage hotels/rooms

**Example**: `customer@gmail.com`

---

### 2. Hotel Owner

**Account Created By**: Self-signup → Register hotel

**Can Do**:
- ✅ Register hotel (once per owner)
- ✅ Add rooms to hotel
- ✅ Edit/delete rooms
- ✅ View bookings for their hotel
- ✅ See dashboard with stats

**Cannot Do**:
- ❌ Book from other hotels
- ❌ Register another hotel (already has one)
- ❌ See other owners' bookings

**Example**: `owner@taj.com`

---

### 3. Admin (Future)

**Not Currently Implemented**

Would have:
- ✅ View all users
- ✅ View all bookings
- ✅ Manage disputes
- ✅ System statistics

---

## 🗄️ Database Schema

### User Collection
```javascript
{
  _id: ObjectId,
  clerkId: String,              // From Clerk auth
  email: String,
  username: String,
  role: String,                 // "customer" or "hotelOwner"
  createdAt: Date
}
```

### Hotel Collection
```javascript
{
  _id: ObjectId,
  name: String,
  address: String,
  contact: String,
  city: String,
  owner: ObjectId,              // Reference to User
  createdAt: Date
}
```

### Room Collection
```javascript
{
  _id: ObjectId,
  hotel: ObjectId,              // Reference to Hotel
  roomType: String,             // Single, Double, Suite, etc.
  pricePerNight: Number,
  description: String,
  features: [String],           // WiFi, AC, TV, etc.
  images: [String],             // URLs from Cloudinary
  createdAt: Date
}
```

### Booking Collection
```javascript
{
  _id: ObjectId,
  user: ObjectId,               // Reference to Customer User
  room: ObjectId,               // Reference to Room
  hotel: ObjectId,              // Reference to Hotel
  checkInDate: Date,
  checkOutDate: Date,
  guests: Number,
  totalPrice: Number,
  status: String,               // "pending" → "confirmed" → "cancelled"
  paymentMethod: String,        // "Pay At Hotel" or "Stripe"
  isPaid: Boolean,              // false → true (after payment)
  createdAt: Date
}
```

---

## 🔐 Authentication Flow

### User Login (Clerk)

```
1. User clicks "Sign In"
   ↓
2. Redirected to Clerk login page
   ↓
3. User enters email/password
   ↓
4. Clerk verifies credentials
   ↓
5. JWT token created
   ↓
6. Token stored in frontend
   ↓
7. Included in all API requests:
   Authorization: Bearer {token}
   ↓
8. Backend middleware (authMiddleware.js) verifies token
   ↓
9. User ID extracted from token
   ↓
10. User can access protected routes
```

### Protected Routes

```javascript
// Without auth token:
GET /api/bookings/user          → 401 Unauthorized

// With auth token:
GET /api/bookings/user          → Returns user's bookings ✅
headers: { Authorization: `Bearer ${token}` }
```

---

## 📊 Complete User Journey Flow

```
HOTEL OWNER JOURNEY
═══════════════════════════════════════════════════════════
1. Sign up with Clerk
2. Register hotel details
   └─ POST /api/hotels
3. Add rooms with images
   └─ POST /api/rooms (images via Cloudinary)
4. View dashboard with bookings
   └─ GET /api/bookings/hotel

CUSTOMER JOURNEY
═══════════════════════════════════════════════════════════
1. Sign up with Clerk
2. Browse hotels on home page
   └─ GET /api/hotels
3. View room details
   └─ GET /api/rooms/:id
4. Check availability
   └─ POST /api/bookings/check-availability
5. Click "Book Now"
   └─ POST /api/bookings/book
      ├─ Creates booking in database
      ├─ Sends email via Nodemailer
      └─ Returns bookingId
6. See "Unpaid" status in My Bookings
7. Click "Pay Now"
   └─ POST /api/bookings/stripe-payment
      └─ Creates Stripe checkout session
8. Enter payment details on Stripe
   └─ Stripe processes payment
9. Stripe sends webhook
   └─ POST /api/stripe (webhook)
      └─ Webhook handler updates booking
         ├─ isPaid = true
         ├─ status = "confirmed"
         └─ paymentMethod = "Stripe"
10. Customer redirected to My Bookings
11. See "Paid" status ✅
```

---

## 🔄 Request/Response Examples

### Example 1: Create Booking

**Request**:
```javascript
POST /api/bookings/book
Headers: {
  Authorization: "Bearer eyJhbGc..."
}
Body: {
  room: "507f1f77bcf86cd799439011",
  checkInDate: "2024-12-25",
  checkOutDate: "2024-12-27",
  guests: 2
}
```

**Response**:
```javascript
{
  success: true,
  message: "Booking created successfully",
  bookingId: "507f1f77bcf86cd799439012"
}
```

**Database Change**:
```javascript
// New Booking created in database
// Email sent to customer
```

---

### Example 2: Get User Bookings

**Request**:
```javascript
GET /api/bookings/user
Headers: {
  Authorization: "Bearer eyJhbGc..."
}
```

**Response**:
```javascript
{
  success: true,
  bookings: [
    {
      _id: "507f1f77bcf86cd799439012",
      hotel: {
        _id: "507f1f77bcf86cd799439001",
        name: "Taj Mahal Resort"
      },
      room: {
        _id: "507f1f77bcf86cd799439011",
        roomType: "Deluxe Suite",
        pricePerNight: 5000
      },
      checkInDate: "2024-12-25",
      checkOutDate: "2024-12-27",
      totalPrice: 10000,
      guests: 2,
      status: "pending",
      isPaid: false
    }
  ]
}
```

---

### Example 3: Stripe Payment

**Request**:
```javascript
POST /api/bookings/stripe-payment
Headers: {
  Authorization: "Bearer eyJhbGc..."
}
Body: {
  bookingId: "507f1f77bcf86cd799439012"
}
```

**Response**:
```javascript
{
  success: true,
  url: "https://checkout.stripe.com/pay/cs_live_..."
}
```

**Frontend Action**:
```javascript
window.location.href = data.url;  // Redirect to Stripe
```

---

### Example 4: Webhook (Automatic)

**Request** (Stripe → Your Server):
```javascript
POST /api/stripe
Headers: {
  stripe-signature: "t=timestamp,v1=signature"
}
Body: {
  type: "checkout.session.completed",
  data: {
    object: {
      metadata: {
        bookingId: "507f1f77bcf86cd799439012"
      }
    }
  }
}
```

**Response**:
```javascript
{
  received: true
}
```

**Database Change**:
```javascript
// Booking with ID 507f1f77bcf86cd799439012 updated:
// isPaid: true
// status: "confirmed"
// paymentMethod: "Stripe"
```

---

## 🛠️ Technology Stack

### Frontend
```
React 18+               → UI framework
Vite                   → Build tool & dev server
Axios                  → HTTP client
React Router           → Navigation
Tailwind CSS           → Styling
React Hot Toast        → Notifications
Clerk                  → Authentication UI
Context API            → State management
```

### Backend
```
Node.js                → Runtime
Express                → Web framework
MongoDB                → Database
Mongoose               → Database ODM
Stripe SDK             → Payment processing
Nodemailer             → Email library
Multer                 → File upload
Cloudinary SDK         → Image storage
Clerk SDK              → Authentication
```

### External Services
```
Clerk                  → User authentication
Stripe                 → Payment processing
Cloudinary             → Image hosting
Brevo                  → Email SMTP relay
```

---

## 🚀 Deployment Architecture

```
┌────────────────────────────────────────────────────────┐
│                      CLIENT                             │
│                 (Vercel / Netlify)                      │
│  React app compiled to static files                     │
│  Hosted globally with CDN                              │
└────────────────────────────────────────────────────────┘
           ↓
        HTTPS Requests
           ↓
┌────────────────────────────────────────────────────────┐
│                      SERVER                             │
│                 (Your hosting)                          │
│  Node.js + Express                                      │
│  Vercel / Heroku / DigitalOcean / etc.                 │
└────────────────────────────────────────────────────────┘
           ↓
   ┌───────┴───────┐
   ↓               ↓
┌─────────┐   ┌──────────┐
│ MongoDB │   │ Services │
│ Atlas   │   ├─ Clerk   │
│ (Cloud) │   ├─ Stripe  │
└─────────┘   ├─ Brevo   │
              └─ Cloudin │
                 -ary    │
              └──────────┘
```

---

## ✨ Key Features Implemented

### For Customers
- ✅ User authentication (Clerk)
- ✅ Browse hotels and rooms
- ✅ Check room availability
- ✅ Book rooms with dates
- ✅ Automatic confirmation email
- ✅ Pay via Stripe
- ✅ View all bookings
- ✅ Payment status tracking

### For Hotel Owners
- ✅ Register hotel
- ✅ Add/edit rooms
- ✅ Upload room images
- ✅ View all bookings
- ✅ See booking status
- ✅ Dashboard with stats

### System Features
- ✅ Real-time availability checking
- ✅ Price calculation (based on nights)
- ✅ Payment processing (Stripe)
- ✅ Email notifications (Nodemailer)
- ✅ Image hosting (Cloudinary)
- ✅ Webhook handling (Stripe)
- ✅ Role-based access control

---

## 🔒 Security Features

- ✅ JWT authentication (Clerk)
- ✅ Protected API routes
- ✅ Stripe webhook signature verification
- ✅ User authorization checks
- ✅ HTTPS only communication
- ✅ Environment variables for secrets
- ✅ No sensitive data in frontend

---

## 📈 What's Working Now (After Fixes)

- ✅ Stripe webhook processes correct event type
- ✅ Booking status updates to "confirmed"
- ✅ Payment marked as "Paid"
- ✅ Email errors don't crash booking
- ✅ Complete error handling throughout

**All ready for your Stripe & Brevo credentials!**
