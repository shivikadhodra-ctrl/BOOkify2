import Hotel from "../models/Hotel.js";
import User from "../models/User.js";

// API to create a new hotel
// POST /api/hotels
export const registerHotel = async (req, res) => {
  try {

    const { name, address, contact, city } = req.body;
    const owner = req.user._id;

    console.log('\n=== HOTEL REGISTRATION ===');
    console.log('Received:', { name, address, contact, city });
    console.log('Owner ID:', owner);

    // Validate required fields
    if (!name || !address || !contact || !city) {
      console.log('❌ Missing fields');
      return res.json({ success: false, message: "All fields are required" });
    }

    // Check if User Already Registered
    const hotel = await Hotel.findOne({ owner });
    if (hotel) {
      console.log('❌ Hotel already exists for this owner');
      return res.json({ success: false, message: "Hotel Already Registered" });
    }

    const newHotel = await Hotel.create({ name, address, contact, city, owner });
    console.log('✅ Hotel created:', newHotel._id);

    // Update User Role
    const updatedUser = await User.findByIdAndUpdate(owner, { role: "hotelOwner" }, { new: true });
    console.log('✅ User role updated to hotelOwner');
    console.log('=== END REGISTRATION ===\n');

    res.json({ success: true, message: "Hotel Registered Successfully", hotel: newHotel });
  } catch (error) {
    console.error('❌ Error:', error.message);
    res.json({ success: false, message: error.message });
  }
};