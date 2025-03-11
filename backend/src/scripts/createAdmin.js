import mongoose from 'mongoose';
import bcryptjs from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../models/user.model.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../../.env') });

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB Atlas');
    
    // Create Suhail admin (full access)
    const suhailExists = await User.findOne({ username: 'Suhail' });
    if (!suhailExists) {
      const hashedPassword = await bcryptjs.hash("admin123", 10);
      await User.create({
        username: "Suhail",
        password: hashedPassword,
        isAdmin: true,
        allowedMainPersons: [
          "67b22c3748dc9b1348b1d635", // Mosa
          "67d09798726e5a47c4caf071", // Nasar
          "67b22c3748dc9b1348b1d637"  // Munif
        ]
      });
      console.log("Suhail admin created with full access");
    }

    // Create Arif admin (restricted access)
    const arifExists = await User.findOne({ username: 'Arif' });
    if (!arifExists) {
      const hashedPassword = await bcryptjs.hash("admin123", 10);
      await User.create({
        username: "Arif",
        password: hashedPassword,
        isAdmin: true,
        allowedMainPersons: [
          "67d09798726e5a47c4caf071" // Only Nasar
        ]
      });
      console.log("Arif admin created with restricted access");
    }

  } catch (error) {
    console.error("Error:", error.message);
  } finally {
    await mongoose.disconnect();
  }
};

createAdmin();