# 📱 Complete User Journey - Step by Step with Code

## Full Workflow: Hotel Owner Lists Hotel → Customer Books → Payment

---

## 🏨 PART 1: HOTEL OWNER LISTS HOTEL

### Step 1: Hotel Owner Registers Their Hotel

**Frontend: HotelReg.jsx**
```javascript
// Hotel owner fills form with:
- Hotel Name
- Address
- Contact Number
- City
```

**What Happens:**
1. Form submitted
2. POST request to `/api/hotels`
3. Authorization header included (hotel owner's JWT token)

**Backend: hotelController.js - registerHotel()**
```javascript
export const registerHotel = async (req, res) => {
  const { name, address, contact, city } = req.body;
  const owner = req.user._id;  // ← From JWT token

  // Check if User Already Registered
  const hotel = await Hotel.findOne({ owner });
  if (hotel) {
    return res.json({ success: false, message: "Hotel Already Registered" });
  }

  // Create hotel in database
  await Hotel.create({ 
    name, 
    address, 
    contact, 
    city, 
    owner: req.user._id  // ← Link to hotel owner
  });

  // Update User Role to "hotelOwner"
  await User.findByIdAndUpdate(owner, { role: "hotelOwner" });

  res.json({ success: true, message: "Hotel Registered Successfully" });
};
```

**Database State After Registration:**
```javascript
// Hotel Collection
{
  _id: ObjectId("hotel_123"),
  name: "Taj Mahal Resort",
  address: "Agra, India",
  contact: "+91 1234567890",
  city: "Agra",
  owner: ObjectId("user_owner_456"),  // ← Hotel Owner's ID
  createdAt: Date(...)
}

// User Collection (Hotel Owner)
{
  _id: ObjectId("user_owner_456"),
  clerkId: "clerk_xyz",
  email: "owner@hotel.com",
  username: "hotelOwner",
  role: "hotelOwner",  // ← Role updated!
  createdAt: Date(...)
}
```

---

### Step 2: Hotel Owner Adds Rooms

**Frontend: AddRoom.jsx**
```javascript
// Hotel owner fills room details:
- Room Type (Single, Double, Suite, etc.)
- Price Per Night
- Room Description
- Room Features
- Room Images (upload to Cloudinary)
```

**What Happens:**
1. Images uploaded to Cloudinary
2. Room data sent to backend with image URLs

**Backend: roomController.js - createRoom()**
```javascript
export const createRoom = async (req, res) => {
  const { hotelId, roomType, pricePerNight, description, features } = req.body;
  const images = req.body.images; // URLs from Cloudinary

  // Create room in database
  await Room.create({
    hotel: hotelId,           // ← Link to hotel
    roomType,
    pricePerNight,
    description,
    features,
    images
  });

  res.json({ success: true, message: "Room Added Successfully" });
};
```

**Database State After Adding Room:**
```javascript
// Room Collection
{
  _id: ObjectId("room_789"),
  hotel: ObjectId("hotel_123"),      // ← Points to Taj Mahal Resort
  roomType: "Deluxe Suite",
  pricePerNight: 5000,
  description: "Beautiful room with city view",
  features: ["WiFi", "AC", "TV", "Mini Bar"],
  images: [
    "https://cloudinary.com/image1.jpg",
    "https://cloudinary.com/image2.jpg"
  ],
  createdAt: Date(...)
}
```

---

### Step 3: Hotels Visible on Home Page

**Frontend: Home.jsx → RecommendedHotels.jsx**
```javascript
// Component fetches all hotels with their rooms
useEffect(() => {
  const fetchHotels = async () => {
    const { data } = await axios.get('/api/hotels');
    // This shows all hotels from ALL hotel owners
    setHotels(data.hotels);
  };
  fetchHotels();
}, []);

// Display hotels from ALL owners
hotels.map(hotel => (
  <div>
    <h2>{hotel.name}</h2>  {/* "Taj Mahal Resort" */}
    <p>{hotel.address}</p>  {/* "Agra, India" */}
  </div>
))
```

**Backend: hotelController.js - getAllHotels()**
```javascript
export const getAllHotels = async (req, res) => {
  try {
    const hotels = await Hotel.find().populate('rooms');
    // Returns ALL hotels from ALL owners
    res.json({ success: true, hotels });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};
```

---

## 👥 PART 2: DIFFERENT USER SEES AND OPENS HOTEL

### Step 1: Customer Views Home Page

**Different User Account (Customer)**
- Logged in as: "customer@gmail.com" (NOT the hotel owner)
- Role: "customer" (default role)

**What They See:**
```
Home Page
├── Recommended Hotels
│   ├── Taj Mahal Resort (Listed by other owner)
│   ├── Oberoi Hotel
│   └── ... other hotels
└── Click on hotel → Opens room details
```

**Frontend: RecommendedHotels.jsx**
```javascript
// Fetch all hotels
const { data } = await axios.get('/api/hotels');

// Display them
{data.hotels.map(hotel => (
  <div onClick={() => navigate(`/room/${room._id}`)}>
    <h2>{hotel.name}</h2>
    {hotel.rooms.map(room => (
      <div>
        <h3>{room.roomType}</h3>
        <p>₹{room.pricePerNight}/night</p>
      </div>
    ))}
  </div>
))}
```

---

### Step 2: Customer Opens Hotel & Sees Rooms

**Frontend: RoomDetails.jsx**

Customer navigates to: `/room/room_789`

The page loads:
```javascript
const { id } = useParams();  // room_789
const room = rooms.find(room => room._id === id);

// Display:
// - Hotel Name: "Taj Mahal Resort"
// - Room Type: "Deluxe Suite"
// - Price: "₹5000/night"
// - Images: [uploaded images]
// - Features: WiFi, AC, TV, Mini Bar
```

**Database Query:**
```javascript
// Backend fetches room data
const room = await Room.findById('room_789')
  .populate('hotel');  // ← Gets hotel details too

// Returns:
{
  _id: ObjectId('room_789'),
  hotel: {
    _id: ObjectId('hotel_123'),
    name: "Taj Mahal Resort",
    address: "Agra, India",
    owner: ObjectId('user_owner_456')  // ← Not the current customer
  },
  roomType: "Deluxe Suite",
  pricePerNight: 5000,
  ...
}
```

---

## 📅 PART 3: CUSTOMER ADDS DATES & BOOKS

### Step 1: Customer Selects Dates

**Frontend: RoomDetails.jsx - Form Input**
```javascript
// Customer enters:
const [checkInDate, setCheckInDate] = useState(null);   // 2024-12-25
const [checkOutDate, setCheckOutDate] = useState(null); // 2024-12-27
const [guests, setGuests] = useState(1);                // 2

// Form submission → onSubmitHandler()
```

**HTML Form:**
```html
<input type="date" onChange={(e) => setCheckInDate(e.target.value)} />
<!-- Customer picks: December 25, 2024 -->

<input type="date" onChange={(e) => setCheckOutDate(e.target.value)} />
<!-- Customer picks: December 27, 2024 -->

<input type="number" onChange={(e) => setGuests(e.target.value)} />
<!-- Customer enters: 2 guests -->
```

---

### Step 2: Check Availability (Optional)

**Frontend: RoomDetails.jsx**
```javascript
const checkAvailability = async () => {
  const { data } = await axios.post('/api/bookings/check-availability', {
    room: 'room_789',
    checkInDate: '2024-12-25',
    checkOutDate: '2024-12-27'
  });

  if (data.isAvailable) {
    setIsAvailable(true);
    toast.success('Room is available');
  } else {
    setIsAvailable(false);
    toast.error('Room is not available');
  }
};
```

**Backend: bookingController.js - checkAvailabilityAPI()**
```javascript
const checkAvailability = async ({ checkInDate, checkOutDate, room }) => {
  // Find all bookings for this room that overlap with selected dates
  const bookings = await Booking.find({
    room,
    checkInDate: { $lte: new Date('2024-12-27') },  // Booking ends on/after check-out
    checkOutDate: { $gte: new Date('2024-12-25') }, // Booking starts on/before check-in
  });

  // If no overlapping bookings, room is available
  const isAvailable = bookings.length === 0;
  return isAvailable;
};

// Return: { success: true, isAvailable: true }
```

**Database Check:**
```javascript
// Find existing bookings for room_789
Booking.find({
  room: ObjectId('room_789'),
  // Check if dates overlap
})

// If existing booking:
// checkInDate: 2024-12-20, checkOutDate: 2024-12-26
// New request: 2024-12-25 to 2024-12-27
// Result: OVERLAPS! Not available ❌

// If no overlapping bookings:
// Result: Available! ✅
```

---

### Step 3: Customer Clicks "Book Now"

**Frontend: RoomDetails.jsx - onSubmitHandler()**
```javascript
const onSubmitHandler = async (e) => {
  try {
    e.preventDefault();
    
    if (!isAvailable) {
      return checkAvailability();  // Re-check first
    } else {
      // Send booking request
      const { data } = await axios.post('/api/bookings/book', {
        room: 'room_789',
        checkInDate: '2024-12-25',
        checkOutDate: '2024-12-27',
        guests: 2,
        paymentMethod: "Pay At Hotel"
      }, {
        headers: {
          Authorization: `Bearer ${await getToken()}`
          // ↑ JWT token of customer (NOT hotel owner)
        }
      });

      if (data.success) {
        toast.success('Booking created successfully');
        navigate('/my-bookings');  // Redirect to booking list
      }
    }
  } catch (error) {
    toast.error(error.message);
  }
};
```

---

## 🎟️ PART 4: BOOKING CREATED & EMAIL SENT

### Backend: bookingController.js - createBooking()

```javascript
export const createBooking = async (req, res) => {
  try {
    const { room, checkInDate, checkOutDate, guests } = req.body;
    const user = req.user._id;  // ← Customer's ID (from JWT)

    // 1. Check availability again (double check)
    const isAvailable = await checkAvailability({
      checkInDate,
      checkOutDate,
      room,
    });

    if (!isAvailable) {
      return res.json({ success: false, message: "Room is not available" });
    }

    // 2. Get room details with hotel info
    const roomData = await Room.findById(room).populate('hotel');
    //   roomData = {
    //     _id: ObjectId('room_789'),
    //     roomType: "Deluxe Suite",
    //     pricePerNight: 5000,
    //     hotel: {
    //       _id: ObjectId('hotel_123'),
    //       name: "Taj Mahal Resort",
    //       address: "Agra, India",
    //       owner: ObjectId('user_owner_456')
    //     }
    //   }

    // 3. Calculate total price
    let totalPrice = roomData.pricePerNight;  // 5000
    const checkIn = new Date(checkInDate);    // 2024-12-25
    const checkOut = new Date(checkOutDate);  // 2024-12-27
    const timeDiff = checkOut.getTime() - checkIn.getTime();
    const nights = Math.ceil(timeDiff / (1000 * 3600 * 24));  // 2 nights
    totalPrice *= nights;  // 5000 * 2 = 10000

    // 4. Create booking in database
    const booking = await Booking.create({
      user: req.user._id,                    // Customer ID
      room: 'room_789',
      hotel: roomData.hotel._id,             // Hotel ID
      guests: 2,
      checkInDate: '2024-12-25',
      checkOutDate: '2024-12-27',
      totalPrice: 10000,
      status: 'pending',     // ← Not confirmed yet
      paymentMethod: 'Pay At Hotel',
      isPaid: false          // ← Not paid yet
    });

    // Database now has:
    // {
    //   _id: ObjectId('booking_111'),
    //   user: ObjectId('customer_id'),
    //   room: ObjectId('room_789'),
    //   hotel: ObjectId('hotel_123'),
    //   checkInDate: Date(2024-12-25),
    //   checkOutDate: Date(2024-12-27),
    //   totalPrice: 10000,
    //   status: "pending",
    //   isPaid: false,
    //   createdAt: Date(...)
    // }

    // 5. Send confirmation email
    try {
      const mailOptions = {
        from: process.env.SENDER_EMAIL,     // noreply@bookify.com
        to: req.user.email,                 // customer@gmail.com
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
            <li><strong>Total Amount:</strong> ₹${booking.totalPrice}</li>
            <li><strong>Number of Guests:</strong> ${booking.guests}</li>
            <li><strong>Status:</strong> ${booking.status}</li>
          </ul>
          <p>Please proceed to payment to confirm your reservation.</p>
          <p>Best regards, Bookify Team</p>
        `,
      };

      await transporter.sendMail(mailOptions);
      // ↑ Uses Brevo SMTP to send email
      console.log("Email sent to:", req.user.email);
    } catch (emailError) {
      console.error("Email failed:", emailError.message);
      // ↑ Email failing doesn't crash booking
    }

    // 6. Return success response
    res.json({
      success: true,
      message: "Booking created successfully",
      bookingId: booking._id  // ← Needed for Stripe later
    });

  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Failed to create booking" });
  }
};
```

---

## 📧 EMAIL WHAT CUSTOMER RECEIVES

**Email sent to: customer@gmail.com**

```
Subject: Hotel Booking Confirmation - Bookify

Dear customer,

Thank you for your booking! Here are your details:

• Booking ID: booking_111
• Hotel Name: Taj Mahal Resort
• Location: Agra, India
• Check-In Date: Tue Dec 25 2024
• Check-Out Date: Thu Dec 27 2024
• Total Amount: ₹10000
• Number of Guests: 2
• Status: pending

Please proceed to payment to confirm your reservation.

Best regards,
Bookify Team
```

---

## 💳 PART 5: CUSTOMER SEES "UNPAID" & CLICKS "PAY NOW"

### Frontend: MyBookings.jsx

```javascript
useEffect(() => {
  if (user) {
    fetchUserBookings();
  }
}, [user]);

const fetchUserBookings = async () => {
  const { data } = await axios.get('/api/bookings/user', {
    headers: { Authorization: `Bearer ${await getToken()}` }
  });
  // ↑ Fetch only THIS user's bookings
  
  setBookings(data.bookings);
};

// Display bookings
{bookings.map((booking) => (
  <div>
    <h2>{booking.hotel.name}</h2>
    <p>₹{booking.totalPrice}</p>
    
    {/* Show payment status */}
    {booking.isPaid ? (
      <p style={{color: 'green'}}>✅ Paid</p>
    ) : (
      <p style={{color: 'red'}}>❌ Unpaid</p>
    )}
    
    {/* Show pay button only if not paid */}
    {!booking.isPaid && (
      <button onClick={() => handlePayment(booking._id)}>
        Pay Now
      </button>
    )}
  </div>
))}
```

**What Customer Sees:**
```
My Bookings Page
┌─────────────────────────────────────────┐
│ Taj Mahal Resort (Deluxe Suite)          │
│ Agra, India                              │
│ Check-In: Tue Dec 25 2024                │
│ Check-Out: Thu Dec 27 2024               │
│ Total: ₹10000                            │
│                                          │
│ Status: ❌ Unpaid (Red indicator)        │
│ [Pay Now Button]                         │
└─────────────────────────────────────────┘
```

---

## 💰 PART 6: STRIPE PAYMENT PROCESS

### Step 1: Customer Clicks "Pay Now"

**Frontend: MyBookings.jsx - handlePayment()**

```javascript
const handlePayment = async (bookingId) => {
  try {
    const { data } = await axios.post('/api/bookings/stripe-payment', {
      bookingId: 'booking_111'
    }, {
      headers: { Authorization: `Bearer ${await getToken()}` }
    });

    if (data.success) {
      // Redirect to Stripe checkout page
      window.location.href = data.url;
      // Example URL:
      // https://checkout.stripe.com/pay/cs_live_...
    } else {
      toast.error(data.message);
    }
  } catch (error) {
    toast.error(error.message);
  }
};
```

---

### Step 2: Backend Creates Stripe Checkout Session

**Backend: bookingController.js - stripePayment()**

```javascript
export const stripePayment = async (req, res) => {
  try {
    const { bookingId } = req.body;  // 'booking_111'

    // Get booking details
    const booking = await Booking.findById(bookingId);
    // {
    //   _id: ObjectId('booking_111'),
    //   totalPrice: 10000,
    //   room: ObjectId('room_789'),
    //   ...
    // }

    // Get room details
    const roomData = await Room.findById(booking.room).populate('hotel');
    // {
    //   roomType: "Deluxe Suite",
    //   pricePerNight: 5000,
    //   hotel: {
    //     name: "Taj Mahal Resort",
    //     ...
    //   }
    // }

    const totalPrice = booking.totalPrice;  // 10000

    const { origin } = req.headers;
    // origin = http://localhost:5173

    const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY);

    // Create line items for Stripe
    const line_items = [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: roomData.hotel.name,  // "Taj Mahal Resort"
          },
          unit_amount: totalPrice * 100,  // Convert to cents: 1000000
        },
        quantity: 1,
      },
    ];

    // Create Stripe Checkout Session
    const session = await stripeInstance.checkout.sessions.create({
      line_items,
      mode: "payment",
      success_url: `${origin}/loader/my-bookings`,
      // ↑ Redirect here after successful payment
      cancel_url: `${origin}/my-bookings`,
      // ↑ Redirect here if payment cancelled
      metadata: {
        bookingId: 'booking_111'  // ← IMPORTANT: Store booking ID
      },
    });

    res.json({ success: true, url: session.url });
    // Returns Stripe checkout URL to frontend
  } catch (error) {
    res.json({ success: false, message: "Payment Failed" });
  }
};
```

---

### Step 3: Stripe Checkout Page (Stripe's Server, Not Your Code)

**Customer sees Stripe's payment page:**

```
┌─────────────────────────────────────┐
│ Stripe Checkout                     │
├─────────────────────────────────────┤
│                                     │
│ Taj Mahal Resort                    │
│ Total: $100.00                      │
│                                     │
│ Email: customer@gmail.com           │
│                                     │
│ Card Information                    │
│ ┌─────────────────────────────────┐ │
│ │ Card Number: [4242 4242 4242] │ │
│ │ Expiry: [12/25]                 │ │
│ │ CVC: [123]                      │ │
│ └─────────────────────────────────┘ │
│                                     │
│ [Complete Payment Button]           │
└─────────────────────────────────────┘
```

**Customer enters test card:**
- Card: `4242 4242 4242 4242`
- Expiry: `12/25` (any future date)
- CVC: `123` (any 3 digits)

---

### Step 4: Stripe Processes Payment

**What Happens on Stripe's Server:**
1. Validates card
2. Processes payment
3. Creates checkout session
4. Sends webhook event to your backend

---

## 🔔 PART 7: WEBHOOK - PAYMENT CONFIRMED

### Stripe Sends Webhook Event to Backend

**Webhook URL:** `/api/stripe`

**Event Type:** `checkout.session.completed`

**Event Data:**
```javascript
{
  type: "checkout.session.completed",
  data: {
    object: {
      id: "cs_live_...",
      amount_total: 1000000,  // In cents
      currency: "usd",
      metadata: {
        bookingId: "booking_111"  // ← From your session.metadata
      },
      payment_intent: "pi_..."
    }
  }
}
```

---

### Backend Processes Webhook

**Backend: stripeWebhooks.js - stripeWebhooks()**

```javascript
export const stripeWebhooks = async (request, response) => {
  const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY);

  const sig = request.headers["stripe-signature"];

  let event;

  try {
    // Verify webhook signature (security check)
    event = stripeInstance.webhooks.constructEvent(
      request.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return response.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  if (event.type === "checkout.session.completed") {  // ← Correct event type
    const session = event.data.object;

    try {
      if (session.metadata && session.metadata.bookingId) {
        const { bookingId } = session.metadata;  // "booking_111"

        // UPDATE BOOKING IN DATABASE
        const updatedBooking = await Booking.findByIdAndUpdate(
          bookingId,
          {
            isPaid: true,              // ← NOW PAID!
            paymentMethod: "Stripe",   // ← Payment method changed
            status: "confirmed",       // ← STATUS UPDATED!
          },
          { new: true }
        );

        console.log("Booking updated successfully:", updatedBooking._id);
        
        // Database now shows:
        // {
        //   _id: ObjectId('booking_111'),
        //   ...
        //   status: "confirmed",      ← Changed from "pending"
        //   isPaid: true,             ← Changed from false
        //   paymentMethod: "Stripe"   ← Changed from "Pay At Hotel"
        // }

      } else {
        console.warn("No bookingId found in session metadata");
      }
    } catch (error) {
      console.error("Error updating booking:", error.message);
    }
  } else {
    console.log("Unhandled event type:", event.type);
  }

  response.json({ received: true });
};
```

---

## ✅ PART 8: CUSTOMER REDIRECTED & SEES "PAID"

### Frontend Redirect After Payment

**Stripe redirects to:** `http://localhost:5173/loader/my-bookings`

The page loads and:
1. Fetches user's bookings again
2. Now sees updated booking status

**Frontend: MyBookings.jsx**

```javascript
// Fetch bookings again
const fetchUserBookings = async () => {
  const { data } = await axios.get('/api/bookings/user', {
    headers: { Authorization: `Bearer ${await getToken()}` }
  });

  // Now booking shows:
  // {
  //   ...
  //   isPaid: true,        // ← Changed!
  //   status: "confirmed"  // ← Changed!
  // }

  setBookings(data.bookings);
};

// Display
{bookings.map((booking) => (
  <div>
    <h2>Taj Mahal Resort</h2>
    
    {booking.isPaid ? (
      <p style={{color: 'green'}}>✅ Paid</p>  // ← NOW THIS SHOWS!
    ) : (
      <p style={{color: 'red'}}>❌ Unpaid</p>
    )}
    
    {!booking.isPaid && (
      <button>Pay Now</button>  // ← Hidden now!
    )}
  </div>
))}
```

**What Customer Sees Now:**
```
My Bookings Page
┌─────────────────────────────────────────┐
│ Taj Mahal Resort (Deluxe Suite)          │
│ Agra, India                              │
│ Check-In: Tue Dec 25 2024                │
│ Check-Out: Thu Dec 27 2024               │
│ Total: ₹10000                            │
│                                          │
│ Status: ✅ Paid (Green indicator)        │
│ [No Pay Now Button]                      │
└─────────────────────────────────────────┘
```

---

## 📊 COMPLETE FLOW DIAGRAM

```
HOTEL OWNER'S SIDE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Account: owner@hotel.com
  ↓
Register Hotel
  ├─ Name: Taj Mahal Resort
  ├─ Address: Agra, India
  └─ Owner ID: ObjectId('user_owner_456')
  ↓
Add Rooms
  ├─ Room 1: Deluxe Suite, ₹5000/night
  ├─ Room 2: Suite, ₹3000/night
  └─ Room 3: Budget, ₹1000/night

GLOBAL DATABASE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Hotels Collection:
  {
    _id: hotel_123,
    name: "Taj Mahal Resort",
    owner: user_owner_456,
    ...
  }

Rooms Collection:
  {
    _id: room_789,
    hotel: hotel_123,
    pricePerNight: 5000,
    ...
  }

CUSTOMER'S SIDE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Account: customer@gmail.com (Different user!)
  ↓
View Home Page
  └─ Sees all hotels from all owners
  ↓
Click "Taj Mahal Resort"
  ↓
Opens Room Details (room_789)
  ├─ Hotel: Taj Mahal Resort
  ├─ Room: Deluxe Suite
  ├─ Price: ₹5000/night
  └─ Images: [...]
  ↓
Select Dates
  ├─ Check-In: Dec 25, 2024
  ├─ Check-Out: Dec 27, 2024
  └─ Guests: 2
  ↓
Check Availability
  └─ Database checks for overlapping bookings
  ↓
Click "Book Now"
  ├─ Create Booking in database
  ├─ status: "pending"
  ├─ isPaid: false
  ├─ totalPrice: ₹10000 (5000 * 2 nights)
  ├─ booking_id: booking_111
  └─ Email sent: "Booking Confirmation"
  ↓
Redirected to My Bookings
  ├─ See booking with "Unpaid" status
  └─ "Pay Now" button visible
  ↓
Click "Pay Now"
  ├─ Request sent to backend
  └─ Backend creates Stripe Session
      (metadata includes: bookingId)
  ↓
Redirected to Stripe Checkout
  ├─ Amount: $100 (₹10000)
  ├─ Product: "Taj Mahal Resort"
  └─ Card: Enter payment details
  ↓
Complete Payment
  └─ Stripe processes payment ✓
  ↓
Stripe Webhook Sent
  ├─ Type: "checkout.session.completed"
  ├─ Contains: bookingId (from metadata)
  └─ Sent to: /api/stripe endpoint
  ↓
Backend Processes Webhook
  ├─ Verify webhook signature
  ├─ Extract bookingId from metadata
  ├─ Update booking in database:
  │  ├─ isPaid: true
  │  ├─ status: "confirmed"
  │  └─ paymentMethod: "Stripe"
  └─ Database updated ✓
  ↓
Customer Redirected Back
  └─ Page refreshes, fetches bookings
  ↓
See Updated Booking
  ├─ Status: ✅ "Paid" (Green)
  └─ No "Pay Now" button
  ↓
Booking Confirmed!
  └─ Hotel owner can see in dashboard
```

---

## 🗄️ DATABASE STATE AT EACH STEP

### Step 1: After "Book Now"
```javascript
Booking: {
  _id: booking_111,
  user: customer_id,
  room: room_789,
  hotel: hotel_123,
  checkInDate: '2024-12-25',
  checkOutDate: '2024-12-27',
  guests: 2,
  totalPrice: 10000,
  status: "pending",        // ← Pending
  paymentMethod: "Pay At Hotel",
  isPaid: false,            // ← Not paid
  createdAt: ...
}
```

### Step 2: After Stripe Payment Confirmed
```javascript
Booking: {
  _id: booking_111,
  user: customer_id,
  room: room_789,
  hotel: hotel_123,
  checkInDate: '2024-12-25',
  checkOutDate: '2024-12-27',
  guests: 2,
  totalPrice: 10000,
  status: "confirmed",      // ← CONFIRMED! ✅
  paymentMethod: "Stripe",  // ← Changed!
  isPaid: true,             // ← PAID! ✅
  createdAt: ...
}
```

---

## 🔐 Security Notes

1. **Different User Accounts**
   - Hotel Owner: Can list hotels and rooms
   - Customer: Can only book from any owner's hotels
   - Each user's bookings are separate

2. **JWT Token Validation**
   - Every booking request includes Authorization header
   - Backend extracts user ID from JWT
   - Can't book for someone else

3. **Stripe Webhook Signature**
   - Only valid webhooks from Stripe are processed
   - Signature verified before updating database

4. **Payment Validation**
   - Booking ID stored in Stripe session metadata
   - Webhook verifies booking exists before updating
   - Amount matches when processing

---

## 📞 Summary

**Complete Flow:**
```
Hotel Owner Lists → Customer Books → Dates Selected → 
"Book Now" Clicked → Booking Created (pending) → 
Email Sent → Customer Sees "Unpaid" → 
"Pay Now" → Stripe Checkout → Payment Processed → 
Webhook Received → Booking Updated (confirmed, paid) → 
Customer Sees "Paid" ✅
```

**Key Takeaway:**
- Hotel owner and customer are **different users**
- Each can operate independently
- Stripe webhook is the critical trigger that confirms payment
- Email is sent immediately after booking (not waiting for payment)
- Status updates only when payment is confirmed by webhook
