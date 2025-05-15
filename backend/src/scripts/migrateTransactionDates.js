import mongoose from 'mongoose';
import Income from '../models/income.model.js';
import Expense from '../models/expense.model.js';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

async function migrateTransactionDates() {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect("mongodb+srv://namoracontracting:GmoOSe9LjKhoq91X@cluster0.vpfd7.mongodb.net/idcard-system");
    console.log('Connected to MongoDB successfully');

    // Count documents before migration
    const incomeCount = await Income.countDocuments({ transactionDate: { $exists: false } });
    const expenseCount = await Expense.countDocuments({ transactionDate: { $exists: false } });

    console.log(`Found ${incomeCount} income records and ${expenseCount} expense records to migrate`);

    // Migrate Income documents
    console.log('Migrating income records...');
    const incomeResult = await Income.updateMany(
      { transactionDate: { $exists: false } },
      [{ $set: { transactionDate: '$createdAt' } }]
    );
    console.log(`Updated ${incomeResult.modifiedCount} income records`);

    // Migrate Expense documents
    console.log('Migrating expense records...');
    const expenseResult = await Expense.updateMany(
      { transactionDate: { $exists: false } },
      [{ $set: { transactionDate: '$createdAt' } }]
    );
    console.log(`Updated ${expenseResult.modifiedCount} expense records`);

    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    // Close MongoDB connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

// Run the migration
migrateTransactionDates(); 