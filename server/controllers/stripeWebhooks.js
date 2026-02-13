import stripe from "stripe";
import Booking from "../models/Booking.js";

// API to handle Stripe Webhooks
// POST /api/stripe
export const stripeWebhooks = async (request, response) => {
  // Stripe Gateway Initialize
  const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY);

  const sig = request.headers["stripe-signature"];

  let event;

  // Validate webhook secret is configured
  if (!process.env.STRIPE_WEBHOOK_SECRET || process.env.STRIPE_WEBHOOK_SECRET.trim().length === 0) {
    console.error("❌ STRIPE_WEBHOOK_SECRET is missing or empty in .env");
    return response.status(400).send("Webhook Error: STRIPE_WEBHOOK_SECRET not configured");
  }

  try {
    event = stripeInstance.webhooks.constructEvent(
      request.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET.trim()
    );
    console.log("✅ Webhook signature verified. Event type:", event.type);
  } catch (err) {
    console.error("❌ Webhook signature verification failed:", err.message);
    return response.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    console.log("📦 checkout.session.completed event received");
    console.log("Session ID:", session.id);
    console.log("Session metadata:", session.metadata);

    try {
      if (session.metadata && session.metadata.bookingId) {
        const { bookingId } = session.metadata;
        console.log("🔍 Updating booking:", bookingId);

        // Mark Payment as Paid and update status to confirmed
        const updatedBooking = await Booking.findByIdAndUpdate(
          bookingId,
          {
            isPaid: true,
            paymentMethod: "Stripe",
            status: "confirmed",
          },
          { new: true }
        );

        if (updatedBooking) {
          console.log("✅ Booking updated successfully:", updatedBooking._id, {
            isPaid: updatedBooking.isPaid,
            status: updatedBooking.status,
          });
        } else {
          console.error("❌ Booking not found with ID:", bookingId);
        }
      } else {
        console.warn("⚠️ No bookingId found in session metadata. Full metadata:", session.metadata);
      }
    } catch (error) {
      console.error("❌ Error updating booking:", error.message, error.stack);
    }
  } else {
    console.log("ℹ️ Unhandled event type:", event.type);
  }

  response.json({ received: true });
};
