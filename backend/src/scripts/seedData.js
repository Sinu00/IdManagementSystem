import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import MainPerson from '../models/mainPerson.model.js';
import Company from '../models/company.model.js';
import Individual from '../models/individual.model.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

const mainPersons = [
  {
    name: "Mosa",
    email: "mosa@example.com",
    contactNumber: "1234567890"
  },
  {
    name: "Nasar",
    email: "nasar@example.com",
    contactNumber: "2345678901"
  },
  {
    name: "Munif",
    email: "munif@example.com",
    contactNumber: "3456789012"
  }
];

const generateCompanies = (mainPersonId) => {
  const companies = [];
  for (let i = 1; i <= 5; i++) {
    companies.push({
      name: `Company ${i} of ${mainPersonId.toString().slice(-4)}`,
      mainPerson: mainPersonId,
      address: `Address ${i}, Street ${i}, City`,
      contactNumber: `${Math.floor(1000000000 + Math.random() * 9000000000)}`
    });
  }
  return companies;
};

const generateIndividuals = (companyId) => {
  const individuals = [];
  const positions = ["Manager", "Supervisor", "Worker", "Engineer", "Technician"];
  
  for (let i = 1; i <= 10; i++) {
    const today = new Date();
    const issueDate = new Date(today.getTime() - Math.random() * 90 * 24 * 60 * 60 * 1000); // Random date within last 90 days
    const expiryDate = new Date(issueDate.getTime() + (180 + Math.floor(Math.random() * 185)) * 24 * 60 * 60 * 1000); // Random date between 6-12 months after issue

    individuals.push({
      name: `Employee ${i} of ${companyId.toString().slice(-4)}`,
      idNumber: `ID${companyId.toString().slice(-4)}${i.toString().padStart(3, '0')}`,
      position: positions[Math.floor(Math.random() * positions.length)],
      company: companyId,
      issueDate,
      expiryDate,
      status: "active"
    });
  }
  return individuals;
};

const seedDatabase = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    await MainPerson.deleteMany({});
    await Company.deleteMany({});
    await Individual.deleteMany({});
    console.log('Cleared existing data');

    // Create main persons
    const createdMainPersons = await MainPerson.insertMany(mainPersons);
    console.log('Created main persons');

    // Create companies for each main person
    for (const mainPerson of createdMainPersons) {
      const companies = generateCompanies(mainPerson._id);
      const createdCompanies = await Company.insertMany(companies);
      console.log(`Created companies for ${mainPerson.name}`);

      // Create individuals for each company
      for (const company of createdCompanies) {
        const individuals = generateIndividuals(company._id);
        await Individual.insertMany(individuals);
        console.log(`Created individuals for ${company.name}`);
      }
    }

    console.log('Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase(); 