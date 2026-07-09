import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();
const MONGODB_URI = process.env.MONGODB_URI

export const connectDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB",MONGODB_URI);
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1); // crash the app if connection fails
  }
};