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

const seedDatabase = async () => {
  try {
    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB Atlas');

    // Find existing MainPerson by ID
    const munifId = "67b22c3748dc9b1348b1d637";
    const existingMainPerson = await MainPerson.findById(munifId);
    if (!existingMainPerson) {
      console.error('MainPerson not found with ID:', munifId);
      process.exit(1);
    }
    console.log('Found main person:', existingMainPerson.name);

    // Drop the collections instead of just deleting documents
    try {
      await mongoose.connection.collection('individuals').drop();
      await mongoose.connection.collection('companies').drop();
      console.log('Dropped existing collections');
    } catch (err) {
      // Ignore error if collections don't exist
      console.log('Collections may not exist, proceeding with seed');
    }

    // Track used iqamaNumbers to check for duplicates before insertion
    const usedIqamaNumbers = new Set();
    
    for (const companyData of companiesData) {
      try {
        const company = await Company.create({
          name: companyData.name,
          mainPerson: existingMainPerson._id,
          crNumber: companyData.crNumber,
          sponserId: companyData.sponserId,
          gosiNumber: companyData.gosiNumber,
          molNumber: companyData.molNumber,
          makthabNumber: companyData.makthabNumber
        });
        console.log(`Created company: ${company.name} (CR: ${company.crNumber})`);

        // Create individuals for this company
        const validIndividuals = companyData.individuals
          .filter(ind => {
            // Filter out records with missing required fields or empty names
            return ind.name?.trim() && 
                   ind.iqamaNumber && 
                   ind.expiryDate &&
                   ind.name.trim() !== " "; // Additional check for space-only names
          })
          .map(ind => ({
            name: ind.name.trim(),
            iqamaNumber: ind.iqamaNumber,
            expiryDate: new Date(ind.expiryDate),
            mainPerson: existingMainPerson._id,
            company: company._id,
            reference: ind.reference || null,
            document: ind.document || null,
            nationality: ind.nationality || "Bangladesh",
            phoneNumber: ind.phoneNumber || null
          }));

        if (validIndividuals.length > 0) {
          // Filter out duplicates before insertion
          const newIndividuals = validIndividuals.filter(ind => {
            if (usedIqamaNumbers.has(ind.iqamaNumber)) {
              console.log(`Skipping duplicate iqamaNumber ${ind.iqamaNumber} for ${ind.name}`);
              return false;
            }
            usedIqamaNumbers.add(ind.iqamaNumber);
            return true;
          });

          if (newIndividuals.length > 0) {
            await Individual.insertMany(newIndividuals, { ordered: false });
            console.log(`Created ${newIndividuals.length} individuals for ${company.name}`);
          } else {
            console.log(`All individuals had duplicate iqamaNumbers for ${company.name}`);
          }
        } else {
          console.log(`No valid individuals found for ${company.name}`);
        }
      } catch (error) {
        console.error(`Error processing company ${companyData.name}:`, error.message);
        // Continue with next company instead of stopping
        continue;
      }
    }

    // Print final statistics
    const totalCompanies = await Company.countDocuments();
    const totalIndividuals = await Individual.countDocuments();
    console.log('\nFinal Statistics:');
    console.log(`Total Companies Created: ${totalCompanies}`);
    console.log(`Total Individuals Created: ${totalIndividuals}`);
    console.log('Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

// Your companiesData array goes here
const companiesData = [
  {
    name: "شركة منيف ناهض العتيبي للتعدين",
    crNumber: "1131337153",
    sponserId: "7038716515",
    gosiNumber: "647234143",
    makthabNumber: "4006125",
    individuals: [
      {
        reference: "hasan",
        document: "belaeyt",
        name: "Abdul Karim",
        iqamaNumber: "2581721871",
        nationality: "Bangladesh",
        expiryDate: "2025-11-05",
        phoneNumber: null
      },
      {
        reference: "hasan",
        document: "belaeyt",
        name: "Amin Fakir",
        iqamaNumber: "2582381741",
        nationality: "Bangladesh",
        expiryDate: "2025-11-18",
        phoneNumber: null
      },
      {
        reference: "hasan",
        document: "belaeyt",
        name: "Lutfar Shaikh",
        iqamaNumber: "2582381667",
        nationality: "Bangladesh",
        expiryDate: "2025-11-18",
        phoneNumber: null
      },
      {
        reference: "hasan",
        document: "belaeyt",
        name: "Ismail",
        iqamaNumber: "2585040427",
        nationality: "Bangladesh",
        expiryDate: "2025-12-02",
        phoneNumber: null
      }
    ]
  },
  {
    name: "شركة منيف ناهض العتيبي للخدمات التجارية",
    crNumber: "647234712",
    sponserId: "4006047",
    gosiNumber: "2014087",
    makthabNumber: "647234135",
    individuals: [
      {
        reference: "hasan",
        document: "belaeyt",
        name: "Abudlla",
        iqamaNumber: "2582710576",
        nationality: "Bangladesh",
        expiryDate: "2025-11-11",
        phoneNumber: null
      },
      {
        reference: "hasan",
        document: "belaeyt",
        name: "Khokon",
        iqamaNumber: "2582710675",
        nationality: "Bangladesh",
        expiryDate: "2025-11-08",
        phoneNumber: null
      }
    ]
  },
  {
    name: "شركة منيف ناهض العتيبي للتدريب",
    crNumber: "647553761",
    sponserId: "4007922",
    gosiNumber: "647554210",
    makthabNumber: "4007923",
    individuals: [
      {
        reference: "Hasan",
        document: "2 years 4 man",
        name: "Harun",
        iqamaNumber: "2588096202",
        nationality: "Bangladesh",
        expiryDate: "2026-01-12",
        phoneNumber: "563601078"
      },
      {
        reference: "Hasan",
        document: "2 years 4 man",
        name: "hanif Kashem",
        iqamaNumber: "2588096277",
        nationality: "Bangladesh",
        expiryDate: "2026-01-15",
        phoneNumber: null
      },
      {
        reference: "Hasan",
        document: "2 years 4 man",
        name: "razib Kamrul",
        iqamaNumber: "2589716469",
        nationality: "Bangladesh",
        expiryDate: "2026-01-18",
        phoneNumber: null
      },
      {
        reference: "Hasan",
        document: "2 years 4 man",
        name: "elias USMAN",
        iqamaNumber: "2589471446",
        nationality: "Bangladesh",
        expiryDate: "2026-02-09",
        phoneNumber: null
      }
    ]
  },
  {
    name: "شركة منيف ناهض العتيبي التجارية",
    crNumber: "647554334",
    sponserId: "4007924",
    gosiNumber: "647554423",
    makthabNumber: "4007927",
    individuals: [
      {
        reference: "Hasan",
        document: "2 year",
        name: "KAML",
        iqamaNumber: "2586856219",
        nationality: "Bangladesh",
        expiryDate: "2026-01-12",
        phoneNumber: null
      },
      {
        reference: "Hasan",
        document: "2 year",
        name: "RAZIB",
        iqamaNumber: "2587325933",
        nationality: "Bangladesh",
        expiryDate: "2026-01-12",
        phoneNumber: null
      },
      {
        reference: "Hasan",
        document: "belaeyt",
        name: "HALIM",
        iqamaNumber: "2581722036",
        nationality: "Bangladesh",
        expiryDate: "2025-11-01",
        phoneNumber: null
      }
    ]
  },
  {
    name: "شركة منيف ناهض العتيبي للعقارات",
    crNumber: "647555055",
    sponserId: "4007930",
    gosiNumber: "647556833",
    makthabNumber: "4007931",
    individuals: [
      {
        reference: "hasan",
        document: null,
        name: " ",
        iqamaNumber: "2558858854",
        nationality: null,
        expiryDate: "2025-04-20",
        phoneNumber: null
      },
      {
        reference: "hasan",
        document: null,
        name: "SALAHUDDIN",
        iqamaNumber: "2564455612",
        nationality: null,
        expiryDate: "2025-03-28",
        phoneNumber: null
      },
      {
        reference: "hasan",
        document: "1 hasan",
        name: "MD RAJU",
        iqamaNumber: null,
        nationality: null,
        expiryDate: "2025-04-07",
        phoneNumber: null
      },
      {
        reference: "hasan",
        document: null,
        name: "ZISAN",
        iqamaNumber: "2247117118",
        nationality: null,
        expiryDate: "2025-06-22",
        phoneNumber: null
      }
    ]
  },
  {
    name: "شركة منيف ناهض العتيبي للمقاوالت",
    crNumber: "647558100",
    sponserId: "4007933",
    gosiNumber: "647558305",
    makthabNumber: "4007934",
    individuals: [
      {
        reference: "hasan",
        document: "2 year %3",
        name: "IBRAHIM",
        iqamaNumber: "2585040518",
        nationality: null,
        expiryDate: "2025-12-20",
        phoneNumber: null
      },
      {
        reference: "hasan",
        document: "2ye",
        name: "SHAHIDUL",
        iqamaNumber: "2585037571",
        nationality: null,
        expiryDate: "2025-12-06",
        phoneNumber: null
      },
      {
        reference: "hasan",
        document: "2 hasan",
        name: "FOEJ",
        iqamaNumber: "2580115638",
        nationality: null,
        expiryDate: "2025-10-06",
        phoneNumber: null
      },
      {
        reference: "hasan",
        document: "2ye",
        name: "Sajib Khan",
        iqamaNumber: "2587809043",
        nationality: null,
        expiryDate: "2026-01-21",
        phoneNumber: null
      }
    ]
  },
  {
    name: "شركة منيف ناهض غالب العتيبي للمقاوالت",
    crNumber: "647623069",
    sponserId: "4008332",
    gosiNumber: "647623689",
    makthabNumber: "4008340",
    individuals: [
      {
        reference: "Hasan",
        document: null,
        name: " ",
        iqamaNumber: "2581788029",
        nationality: null,
        expiryDate: "2025-10-30",
        phoneNumber: null
      },
      {
        reference: "Hasan",
        document: null,
        name: "TOUHIDUL",
        iqamaNumber: "2581787856",
        nationality: null,
        expiryDate: "2025-10-22",
        phoneNumber: null
      },
      {
        reference: "Hasan",
        document: "3 Hasan",
        name: "SERAZUL",
        iqamaNumber: "2578520096",
        nationality: null,
        expiryDate: "2025-09-26",
        phoneNumber: null
      },
      {
        reference: "Hasan",
        document: null,
        name: "SHAMAL",
        iqamaNumber: "2577618198",
        nationality: null,
        expiryDate: "2025-09-16",
        phoneNumber: null
      }
    ]
  },
  {
    name: "شركة منيف ناهض العتيبي للتجارة والمقاوالت",
    crNumber: "648276036",
    sponserId: "4011780",
    gosiNumber: "648280173",
    makthabNumber: "4011793",
    individuals: [
      {
        reference: "hasan",
        document: null,
        name: "rasel HASHIRUL",
        iqamaNumber: "2580113351",
        nationality: null,
        expiryDate: "2025-10-07",
        phoneNumber: null
      },
      {
        reference: "hasan",
        document: null,
        name: "rasel NEAMAT",
        iqamaNumber: "2579340874",
        nationality: null,
        expiryDate: "2025-09-29",
        phoneNumber: null
      },
      {
        reference: "hasan",
        document: "8 hasan rasel",
        name: "TORIKUL",
        iqamaNumber: "2577358316",
        nationality: null,
        expiryDate: "2025-09-11",
        phoneNumber: null
      },
      {
        reference: "hasan",
        document: null,
        name: "rasel MD JUEL",
        iqamaNumber: "2577358415",
        nationality: null,
        expiryDate: "2025-09-11",
        phoneNumber: null
      }
    ]
  },
  {
    name: "شركة منيف ناهض العتيبي للصناعة",
    crNumber: "648312326",
    sponserId: "4011956",
    gosiNumber: "648455097",
    makthabNumber: "4012424",
    individuals: [
      {
        reference: "Muhammad",
        document: "fida",
        name: " ",
        iqamaNumber: "2582414054",
        nationality: null,
        expiryDate: null,
        phoneNumber: null
      },
      {
        reference: "Muhd",
        document: "Hassan A",
        name: " ",
        iqamaNumber: "2582414203",
        nationality: null,
        expiryDate: null,
        phoneNumber: null
      },
      {
        reference: null,
        document: null,
        name: null,
        iqamaNumber: null,
        nationality: null,
        expiryDate: null,
        phoneNumber: null
      },
      {
        reference: null,
        document: null,
        name: null,
        iqamaNumber: null,
        nationality: null,
        expiryDate: null,
        phoneNumber: null
      }
    ]
  },
  {
    name: "شركة منيف ناهض غالب العتيبي للمقاوالت",
    crNumber: "647624766",
    sponserId: "4008343",
    gosiNumber: "647625320",
    makthabNumber: "4008345",
    individuals: [
      {
        reference: "ab kader",
        document: null,
        name: " ",
        iqamaNumber: null,
        nationality: null,
        expiryDate: null,
        phoneNumber: null
      },
      {
        reference: "ab kader",
        document: null,
        name: " ",
        iqamaNumber: null,
        nationality: null,
        expiryDate: null,
        phoneNumber: null
      },
      {
        reference: null,
        document: null,
        name: null,
        iqamaNumber: null,
        nationality: null,
        expiryDate: null,
        phoneNumber: null
      },
      {
        reference: null,
        document: null,
        name: null,
        iqamaNumber: null,
        nationality: null,
        expiryDate: null,
        phoneNumber: null
      }
    ]
  },
  {
    name: "شركة منيف ناهض غالب العتيبي للمقاوالت",
    crNumber: "647625711",
    sponserId: "4008346",
    gosiNumber: "647626238",
    makthabNumber: "4008347",
    individuals: [
      {
        reference: null,
        document: null,
        name: null,
        iqamaNumber: null,
        nationality: null,
        expiryDate: null,
        phoneNumber: null
      },
      {
        reference: null,
        document: null,
        name: null,
        iqamaNumber: null,
        nationality: null,
        expiryDate: null,
        phoneNumber: null
      },
      {
        reference: null,
        document: null,
        name: null,
        iqamaNumber: null,
        nationality: null,
        expiryDate: null,
        phoneNumber: null
      },
      {
        reference: null,
        document: null,
        name: null,
        iqamaNumber: null,
        nationality: null,
        expiryDate: null,
        phoneNumber: null
      }
    ]
  }
];

seedDatabase(); 