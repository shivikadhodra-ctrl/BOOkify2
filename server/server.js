import path from "path";
import { fileURLToPath } from "url";
import express from "express";
import "dotenv/config";
import cors from "cors";
import connectDB from "./configs/db.js";
import { clerkMiddleware } from "@clerk/express";
import userRouter from "./routes/userRoutes.js";
import hotelRouter from "./routes/hotelRoutes.js";
import roomRouter from "./routes/roomRoutes.js";
import bookingRouter from "./routes/bookingRoutes.js";
import clerkWebhooks from "./controllers/clerkWebhooks.js";
import connectCloudinary from "./configs/cloudinary.js";
import { stripeWebhooks } from "./controllers/stripeWebhooks.js";

// Fix __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Connect DB & Cloudinary
connectDB();
connectCloudinary();

const app = express();
app.use(cors());

// Stripe Webhook (IMPORTANT: raw body)
app.post("/api/stripe", express.raw({ type: "application/json" }), stripeWebhooks);

// Middleware
app.use(express.json());
app.use(clerkMiddleware());

// Clerk Webhook
app.use("/api/clerk", clerkWebhooks);

// API Routes
app.use("/api/user", userRouter);
app.use("/api/hotels", hotelRouter);
app.use("/api/rooms", roomRouter);
app.use("/api/bookings", bookingRouter);

// Serve React frontend
app.use(express.static(path.join(__dirname, "../client/dist")));

// ✅ FIXED: catch-all route (NO "*")
app.get("/*", (req, res) => {
  res.sendFile(path.join(__dirname, "../client/dist", "index.html"));
});

// OR you can use this instead (even safer):
// app.use((req, res) => {
//   res.sendFile(path.join(__dirname, "../client/dist", "index.html"));
// });

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
