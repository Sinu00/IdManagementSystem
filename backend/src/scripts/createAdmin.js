import mongoose from 'mongoose';
import bcryptjs from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../models/user.model.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars from root directory
dotenv.config({ path: path.join(__dirname, '../../../.env') });

const createAdmin = async () => {
  try {
    console.log('Connecting to MongoDB Atlas...');
    console.log('MongoDB URI:', process.env.MONGODB_URI);
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB Atlas');
    
    // Check if admin already exists
    const existingAdmin = await User.findOne({ username: 'admin' });
    if (existingAdmin) {
      console.log('Admin user already exists');
      return;
    }
    
    const hashedPassword = await bcryptjs.hash("admin123", 10);
    
    const admin = await User.create({
      username: "admin",
      password: hashedPassword,
      role: "admin"
    });

    console.log("Admin user created successfully:", admin);
  } catch (error) {
    console.error("Error:", error.message);
    console.error("Full error:", error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB Atlas');
  }
};

createAdmin(); 