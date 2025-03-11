import mongoose from 'mongoose';
import dotenv from 'dotenv';
import MainPerson from '../models/mainPerson.model.js';
import Company from '../models/company.model.js';
import Individual from '../models/individual.model.js';

dotenv.config();

const MAIN_PERSON_IDS = [
  "67b22c3748dc9b1348b1d635", // Mosa
  "67d09798726e5a47c4caf071", // Nasar
  "67b22c3748dc9b1348b1d637"  // Munif
];

// Helper function to generate random data
const generateRandomData = {
  crNumber: () => Math.floor(1000000000 + Math.random() * 9000000000).toString(),
  sponsorId: () => Math.floor(1000000000 + Math.random() * 9000000000).toString(),
  gosiNumber: () => Math.floor(100000000 + Math.random() * 900000000).toString(),
  molNumber: () => Math.floor(1000000 + Math.random() * 9000000).toString(),
  iqamaNumber: () => Math.floor(2500000000 + Math.random() * 100000000).toString(),
  phoneNumber: () => `05${Math.floor(10000000 + Math.random() * 90000000)}`,
  amount: () => Math.floor(3000 + Math.random() * 4000),
  expiryDate: () => {
    const rand = Math.random();
    const today = new Date();
    if (rand < 0.2) { // 20% expired
      return new Date(today.setMonth(today.getMonth() - Math.floor(Math.random() * 3)));
    } else if (rand < 0.4) { // 20% expiring soon
      return new Date(today.setDate(today.getDate() + Math.floor(Math.random() * 30)));
    } else { // 60% valid
      return new Date(today.setMonth(today.getMonth() + Math.floor(Math.random() * 12)));
    }
  }
};

const COMPANY_PREFIXES = [
  'شركة ابداع', 'شركة منارة', 'شركة روح', 'شركة نجم', 'شركة قمة',
  'شركة اركان', 'شركة افاق', 'شركة برج', 'شركة دار', 'شركة ركن'
];

const COMPANY_SUFFIXES = [
  'للمقاولات', 'التجارية', 'للخدمات', 'للتجارة', 'للصناعة',
  'للعقارات', 'للتطوير', 'للاستثمار', 'للتشييد', 'للبناء'
];

const NAMES = [
  'Abdul Karim', 'Amin Fakir', 'Harun', 'Mohammad Ali', 'Rashid Khan',
  'Sajid Hussain', 'Kamal Ahmed', 'Imran Shah', 'Nasir Uddin', 'Zahir Abbas',
  'Farhan Khan', 'Salman Ahmed', 'Yasir Shah', 'Omar Farooq', 'Bilal Khan'
];

const REFERRED_BY = ['Suhail', 'Kadher', 'Faris'];
const LAST_UPDATED_BY = ['Suhail', 'Arif'];
const NATIONALITIES = ['Bangladesh', 'India', 'Pakistan', 'Nepal'];

const seedDatabase = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    await Company.deleteMany({});
    await Individual.deleteMany({});
    console.log('Cleared existing data');

    const usedIqamaNumbers = new Set();
    const usedCRNumbers = new Set();

    // For each main person
    for (const mainPersonId of MAIN_PERSON_IDS) {
      console.log(`Creating companies for main person: ${mainPersonId}`);

      // Create 30 companies
      for (let i = 0; i < 30; i++) {
        let crNumber;
        do {
          crNumber = generateRandomData.crNumber();
        } while (usedCRNumbers.has(crNumber));
        usedCRNumbers.add(crNumber);

        const company = await Company.create({
          name: `${COMPANY_PREFIXES[i % 10]} ${COMPANY_SUFFIXES[Math.floor(i / 3) % 10]}`,
          crNumber,
          sponserId: generateRandomData.sponsorId(),
          gosiNumber: generateRandomData.gosiNumber(),
          molNumber: generateRandomData.molNumber(),
          mainPerson: mainPersonId
        });

        // Create 4 individuals for each company
        for (let j = 0; j < 4; j++) {
          let iqamaNumber;
          do {
            iqamaNumber = generateRandomData.iqamaNumber();
          } while (usedIqamaNumbers.has(iqamaNumber));
          usedIqamaNumbers.add(iqamaNumber);

          const amount = generateRandomData.amount();
          await Individual.create({
            name: NAMES[Math.floor(Math.random() * NAMES.length)],
            nationality: NATIONALITIES[Math.floor(Math.random() * NATIONALITIES.length)],
            phoneNumber: generateRandomData.phoneNumber(),
            iqamaNumber,
            expiryDate: generateRandomData.expiryDate(),
            company: company._id,
            mainPerson: mainPersonId,
            referredBy: REFERRED_BY[Math.floor(Math.random() * REFERRED_BY.length)],
            amount,
            iqamaPrice: 5000,
            totalPaidAmount: amount,
            pendingAmount: 5000 - amount,
            isFullyPaid: amount >= 5000,
            lastUpdatedBy: LAST_UPDATED_BY[Math.floor(Math.random() * LAST_UPDATED_BY.length)],
            lastUpdateDate: new Date(),
            paymentHistory: [{
              amount,
              paidBy: REFERRED_BY[Math.floor(Math.random() * REFERRED_BY.length)],
              paidAt: new Date()
            }]
          });
        }
      }
    }

    console.log('Database seeded successfully!');
    const stats = {
      companies: await Company.countDocuments(),
      individuals: await Individual.countDocuments()
    };
    console.log('Statistics:', stats);
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase(); 