import transporter from "../configs/nodemailer.js";
import Booking from "../models/Booking.js";
import Hotel from "../models/Hotel.js";
import Room from "../models/Room.js";
import stripe from "stripe";

// Function to Check Availablity of Room
const checkAvailability = async ({ checkInDate, checkOutDate, room }) => {

  try {
    const bookings = await Booking.find({
      room,
      checkInDate: { $lte: checkOutDate },
      checkOutDate: { $gte: checkInDate },
    });

    const isAvailable = bookings.length === 0;
    return isAvailable;

  } catch (error) {
    console.error(error.message);
  }
};

// API to check availability of room
// POST /api/bookings/check-availability
export const checkAvailabilityAPI = async (req, res) => {
  try {
    const { room, checkInDate, checkOutDate } = req.body;
    const isAvailable = await checkAvailability({ checkInDate, checkOutDate, room });
    res.json({ success: true, isAvailable });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// API to create a new booking
// POST /api/bookings/book
export const createBooking = async (req, res) => {
  try {

    const { room, checkInDate, checkOutDate, guests } = req.body;

    const user = req.user._id;

    // Before Booking Check Availability
    const isAvailable = await checkAvailability({
      checkInDate,
      checkOutDate,
      room,
    });

    if (!isAvailable) {
      return res.json({ success: false, message: "Room is not available" });
    }

    // Get totalPrice from Room
    const roomData = await Room.findById(room).populate("hotel");
    let totalPrice = roomData.pricePerNight;

    // Calculate totalPrice based on nights
    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    const timeDiff = checkOut.getTime() - checkIn.getTime();
    const nights = Math.ceil(timeDiff / (1000 * 3600 * 24));

    totalPrice *= nights;

    const booking = await Booking.create({
      user,
      room,
      hotel: roomData.hotel._id,
      guests: +guests,
      checkInDate,
      checkOutDate,
      totalPrice,
    });

    // Send email confirmation
    try {
      const mailOptions = {
        from: process.env.SENDER_EMAIL,
        to: req.user.email,
        subject: 'Hotel Booking Confirmation - Bookify',
        html: `
          <h2>Your Booking Details</h2>
          <p>Dear ${req.user.username},</p>
          <p>Thank you for your booking! Here are your details:</p>
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
          <p>We look forward to welcoming you!</p>
          <p>If you need to make any changes, feel free to contact us.</p>
          <br/>
          <p>Best regards,<br/>Bookify Team</p>
        `,
      };

      await transporter.sendMail(mailOptions);
      console.log("Booking confirmation email sent to:", req.user.email);
    } catch (emailError) {
      console.error("Failed to send email:", emailError.message);
      // Don't fail the booking if email fails
    }

    res.json({ success: true, message: "Booking created successfully", bookingId: booking._id });

  } catch (error) {
    console.log(error);
    
    res.json({ success: false, message: "Failed to create booking" });
  }
};

// API to get all bookings for a user
// GET /api/bookings/user
export const getUserBookings = async (req, res) => {
  try {
    const user = req.user._id;
    const bookings = await Booking.find({ user }).populate("room hotel").sort({ createdAt: -1 });
    res.json({ success: true, bookings });
  } catch (error) {
    res.json({ success: false, message: "Failed to fetch bookings" });
  }
};


export const getHotelBookings = async (req, res) => {
  try {
    const hotel = await Hotel.findOne({ owner: req.user._id });
    if (!hotel) {
      return res.json({ success: false, message: "No Hotel found" });
    }
    const bookings = await Booking.find({ hotel: hotel._id }).populate("room hotel user").sort({ createdAt: -1 });
    // Total Bookings
    const totalBookings = bookings.length;
    // Total Revenue
    const totalRevenue = bookings.reduce((acc, booking) => acc + booking.totalPrice, 0);

    res.json({ success: true, dashboardData: { totalBookings, totalRevenue, bookings } });
  } catch (error) {
    res.json({ success: false, message: "Failed to fetch bookings" });
  }
};


export const stripePayment = async (req, res) => {
  try {

    const { bookingId } = req.body;

    const booking = await Booking.findById(bookingId);
    const roomData = await Room.findById(booking.room).populate("hotel");
    const totalPrice = booking.totalPrice;

    // Use Origin header if provided by browser; fall back to Referer or a sensible default
    const origin = req.headers.origin || req.headers.referer || process.env.CLIENT_URL || `http://localhost:5173`;

    // Validate Stripe secret key
    if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_SECRET_KEY.startsWith('sk_')) {
      const msg = 'Stripe secret key is missing or invalid. Check STRIPE_SECRET_KEY in .env (must start with sk_)';
      console.error(msg, process.env.STRIPE_SECRET_KEY ? '(value set)' : '(not set)');
      return res.status(500).json({ success: false, message: msg });
    }

    const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY);

    // Create Line Items for Stripe (ensure unit_amount is integer cents)
    const unitAmount = Math.round((Number(totalPrice) || 0) * 100);
    if (unitAmount <= 0) {
      const msg = 'Invalid totalPrice for booking, cannot create payment session';
      console.error(msg, { bookingId, totalPrice });
      return res.status(400).json({ success: false, message: msg });
    }

    const line_items = [
      {
        price_data: {
          currency: process.env.CURRENCY?.toLowerCase() || 'usd',
          product_data: {
            name: roomData.hotel.name,
          },
          unit_amount: unitAmount,
        },
        quantity: 1,
      },
    ];

    // Create Checkout Session
    const session = await stripeInstance.checkout.sessions.create({
      line_items,
      mode: 'payment',
      success_url: `${origin.replace(/\/$/, '')}/loader/my-bookings`,
      cancel_url: `${origin.replace(/\/$/, '')}/my-bookings`,
      metadata: {
        bookingId,
      },
    });
    res.json({ success: true, url: session.url });

  } catch (error) {
    console.error('Stripe payment error:', error);
    const message = error?.message || 'Payment Failed';
    res.status(500).json({ success: false, message });
  }
}