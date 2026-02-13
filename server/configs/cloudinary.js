import { v2 as cloudinary } from "cloudinary";

const connectCloudinary = async () => {
  try {
    console.log("Configuring Cloudinary with:");
    console.log("Cloud Name:", process.env.CLOUDINARY_CLOUD_NAME);
    console.log("API Key:", process.env.CLOUDINARY_API_KEY);
    console.log("API Secret:", process.env.CLOUDINARY_API_SECRET ? "***set***" : "***not set***");
    
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
    
    console.log("Cloudinary configuration completed successfully");
  } catch (error) {
    console.error("Cloudinary configuration error:", error);
  }
};

export default connectCloudinary;
