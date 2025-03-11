import mongoose from 'mongoose';
import bcryptjs from 'bcryptjs';
import User from '../models/user.model.js';
import MainPerson from '../models/mainPerson.model.js';
import dotenv from 'dotenv';

dotenv.config();

const createInitialData = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Create main persons
    const mainPersons = await MainPerson.create([
      {
        name: 'Munif',
        email: 'munif@example.com',
        contactNumber: '+1234567890'
      },
      {
        name: 'Nasser',
        email: 'nasser@example.com',
        contactNumber: '+1234567891'
      },
      {
        name: 'Mosa',
        email: 'mosa@example.com',
        contactNumber: '+1234567892'
      }
    ]);

    console.log('Main persons created successfully');

    // Hash password
    const salt = await bcryptjs.genSalt(10);
    const hashedPassword = await bcryptjs.hash('admin123', salt);

    // Create admin user with all access
    const adminUser = await User.create({
      username: 'suhail',
      password: hashedPassword,
      isAdmin: true,
      allowedMainPersons: mainPersons.map(person => person._id),
      hasIncomeAccess: ['nasser', 'company']
    });

    console.log('Admin user created successfully');
    console.log('Initial setup completed!');

  } catch (error) {
    console.error('Error during initialization:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

// Run the initialization
createInitialData(); 