import User from "../models/User.js";
import { clerkClient } from "@clerk/express";

// Middleware to check if user is authenticated and sync with database
export const protect = async (req, res, next) => {
  try {
    // req.auth is set by Clerk's requireAuth middleware
    const userId = req.auth?.userId;
    
    console.log('\n=== AUTH MIDDLEWARE ===');
    console.log('Clerk userId from req.auth:', userId);
    
    if (!userId) {
      console.log('❌ No userId found in req.auth');
      return res.status(401).json({ success: false, message: "not authenticated" });
    }
    
    let user = await User.findById(userId);
    console.log('✅ User lookup - Found in DB:', !!user);
    
    // If user doesn't exist in our database, create them from Clerk data
    if (!user) {
      console.log('📝 User not in DB - creating from Clerk...');
      try {
        // Get user data from Clerk
        const clerkUser = await clerkClient.users.getUser(userId);
        console.log('Clerk user fetched:', clerkUser.id);
        
        // Create user in our database
        const userData = {
          _id: clerkUser.id,
          email: clerkUser.emailAddresses[0]?.emailAddress || '',
          username: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || clerkUser.emailAddresses[0]?.emailAddress || 'User',
          image: clerkUser.imageUrl || '',
        };
        
        console.log('Creating user with data:', userData);
        user = await User.create(userData);
        console.log('✅ User created in DB:', user._id, user.username);
      } catch (error) {
        console.error('❌ Error creating user in DB:', error.message);
        return res.status(500).json({ success: false, message: "Error creating user profile" });
      }
    }
    
    // Attach user to request
    req.user = user;
    console.log('✅ User attached to request:', req.user._id);
    console.log('=== END AUTH ===\n');
    
    next();
  } catch (error) {
    console.error('❌ Auth middleware error:', error.message);
    return res.status(500).json({ success: false, message: "Authentication error", error: error.message });
  }
};
