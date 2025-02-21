import mongoose from 'mongoose';
import bcryptjs from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../models/user.model.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

const createUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB Atlas');
    
    // Create regular users
    const users = [
      {
        username: "user3",
        password: "user123",
        isAdmin: false,
        allowedMainPersons: [
          "67b22c3748dc9b1348b1d635", // Mosa
          "67b22c3748dc9b1348b1d636",  // Nasar
          "67b22c3748dc9b1348b1d637"  // Munif
        ],
        hasIncomeAccess: true
      },
      {
        username: "user4",
        password: "user123",
        isAdmin: false,
        allowedMainPersons: [
          "67b22c3748dc9b1348b1d637"  // Munif
        ]
      }
    ];

    for (const userData of users) {
      const existingUser = await User.findOne({ username: userData.username });
      if (!existingUser) {
        const hashedPassword = await bcryptjs.hash(userData.password, 10);
        await User.create({
          ...userData,
          password: hashedPassword
        });
        console.log(`Created user: ${userData.username}`);
      }
    }

  } catch (error) {
    console.error("Error:", error.message);
  } finally {
    await mongoose.disconnect();
  }
};

createUsers(); 