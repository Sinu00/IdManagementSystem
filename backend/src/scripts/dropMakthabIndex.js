import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Company from '../models/company.model.js';

dotenv.config();

const dropMakthabIndex = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Drop the makthabNumber index
    await mongoose.connection.collection('companies').dropIndex('makthabNumber_1');
    
    console.log('Successfully dropped makthabNumber index');
    process.exit(0);
  } catch (error) {
    if (error.code === 27) {
      console.log('Index does not exist, continuing...');
      process.exit(0);
    }
    console.error('Error dropping index:', error);
    process.exit(1);
  }
};

dropMakthabIndex(); 