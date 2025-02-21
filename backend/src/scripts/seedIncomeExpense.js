import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Income from '../models/income.model.js';
import Expense from '../models/expense.model.js';
import Individual from '../models/individual.model.js';
import Company from '../models/company.model.js';
import MainPerson from '../models/mainPerson.model.js';

dotenv.config();

const EXPENSE_CATEGORIES = [
  'Office Rent',
  'Utilities',
  'Salaries',
  'Transportation',
  'Office Supplies',
  'Maintenance',
  'Insurance',
  'Marketing',
  'Miscellaneous'
];

const EXPENSE_DESCRIPTIONS = [
  'Monthly office rent payment',
  'Electricity and water bills',
  'Staff salary payments',
  'Transportation costs',
  'Office supplies and stationery',
  'Equipment maintenance',
  'Insurance premium',
  'Marketing campaign expenses',
  'Miscellaneous expenses'
];

// Helper function to generate random dates within the last 6 months
const generateRandomDate = () => {
  const today = new Date();
  const sixMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 6, today.getDate());
  return new Date(sixMonthsAgo.getTime() + Math.random() * (today.getTime() - sixMonthsAgo.getTime()));
};

// Helper function to generate random amount
const generateRandomAmount = (min, max) => {
  return Math.floor(min + Math.random() * (max - min));
};

const seedIncomeExpense = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    await Income.deleteMany({});
    await Expense.deleteMany({});
    console.log('Cleared existing income/expense data');

    // Get all individuals to use their data for income entries
    const individuals = await Individual.find()
      .populate({
        path: 'company',
        populate: { 
          path: 'mainPerson',
          model: 'MainPerson'
        }
      });

    if (!individuals.length) {
      throw new Error('No individuals found in database. Run seed script first.');
    }

    console.log(`Found ${individuals.length} individuals for reference`);

    // Create 100 income entries with better error handling
    const incomePromises = Array(100).fill().map(async (_, index) => {
      try {
        const randomIndividual = individuals[Math.floor(Math.random() * individuals.length)];
        if (!randomIndividual.company?.mainPerson?._id) {
          console.warn(`Skipping income entry ${index}: Invalid individual data`);
          return null;
        }

        const amount = generateRandomAmount(1000, 6000);
        
        return Income.create({
          name: randomIndividual.name,
          iqamaNumber: randomIndividual.iqamaNumber,
          amount,
          referredBy: ['Suhail', 'Kadher', 'Faris'][Math.floor(Math.random() * 3)],
          mainPerson: randomIndividual.company.mainPerson._id,
          createdAt: generateRandomDate(),
          addedBy: ['Suhail', 'Arif'][Math.floor(Math.random() * 2)],
          notes: `Payment received for Iqama renewal - Batch ${Math.floor(Math.random() * 100)}`
        });
      } catch (err) {
        console.error(`Error creating income entry ${index}:`, err);
        return null;
      }
    });

    // Create 100 expense entries
    const expensePromises = Array(100).fill().map(async (_, index) => {
      try {
        const categoryIndex = Math.floor(Math.random() * EXPENSE_CATEGORIES.length);
        const amount = generateRandomAmount(500, 10000);
        
        return Expense.create({
          name: EXPENSE_CATEGORIES[categoryIndex],
          amount,
          createdAt: generateRandomDate()
        });
      } catch (err) {
        console.error(`Error creating expense entry ${index}:`, err);
        return null;
      }
    });

    // Wait for all creations to complete and filter out nulls
    const results = await Promise.all([...incomePromises, ...expensePromises]);
    const validResults = results.filter(result => result !== null);

    // Get statistics
    const stats = {
      incomeEntries: await Income.countDocuments(),
      expenseEntries: await Expense.countDocuments(),
      totalIncome: await Income.aggregate([
        { $group: { _id: null, total: { $sum: "$amount" } } }
      ]),
      totalExpense: await Expense.aggregate([
        { $group: { _id: null, total: { $sum: "$amount" } } }
      ])
    };

    console.log('Income/Expense data seeded successfully!');
    console.log('Statistics:', {
      incomeEntries: stats.incomeEntries,
      expenseEntries: stats.expenseEntries,
      totalIncome: stats.totalIncome[0]?.total || 0,
      totalExpense: stats.totalExpense[0]?.total || 0,
      successfulEntries: validResults.length
    });

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error seeding income/expense data:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
};

seedIncomeExpense(); 