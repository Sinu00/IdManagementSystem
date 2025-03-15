import mongoose from 'mongoose';
import readline from 'readline';
import Individual from '../models/individual.model.js';
import Company from '../models/company.model.js';
import MainPerson from '../models/mainPerson.model.js';
import dotenv from 'dotenv';

dotenv.config();

// const MONGODB_URI = 'mongodb://namoracontracting:GmoOSe9LjKhoq91X@cluster0-shard-00-00.vpfd7.mongodb.net:27017,cluster0-shard-00-01.vpfd7.mongodb.net:27017,cluster0-shard-00-02.vpfd7.mongodb.net:27017/idcard-system?ssl=true&replicaSet=atlas-rbm6lw-shard-0&authSource=admin&retryWrites=true&w=majority&appName=Cluster0';
const MONGODB_URI = 'mongodb://cssinu7:realmadrid710@cluster0-shard-00-00.2scdw.mongodb.net:27017,cluster0-shard-00-01.2scdw.mongodb.net:27017,cluster0-shard-00-02.2scdw.mongodb.net:27017/idcard-system?ssl=true&replicaSet=atlas-cgf85c-shard-0&authSource=admin&retryWrites=true&w=majority&appName=Cluster0';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('MongoDB connected successfully.');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    process.exit(1);
  }
}

async function findInvalidIndividuals() {
  try {
    // Find all individuals and populate company
    const individuals = await Individual.find()
      .populate({
        path: 'company',
        select: 'name mainPerson'
      });

    // Filter individuals with missing mainPerson
    const invalidIndividuals = individuals.filter(individual => {
      // Check if mainPerson is missing or invalid
      const hasValidMainPerson = individual.mainPerson && 
                                mongoose.Types.ObjectId.isValid(individual.mainPerson);
      
      // Also check if company exists and has a valid mainPerson
      const hasValidCompanyMainPerson = individual.company && 
                                      individual.company.mainPerson &&
                                      mongoose.Types.ObjectId.isValid(individual.company.mainPerson);
      
      return !hasValidMainPerson || !hasValidCompanyMainPerson;
    });

    // Fetch company names separately to avoid population issues
    const enrichedInvalidIndividuals = await Promise.all(
      invalidIndividuals.map(async (individual) => {
        if (individual.company) {
          const company = await Company.findById(individual.company._id)
            .select('name')
            .lean();
          return {
            ...individual.toObject(),
            company: company || { name: 'Unknown' }
          };
        }
        return individual.toObject();
      })
    );

    return enrichedInvalidIndividuals;
  } catch (error) {
    console.error('Error finding invalid individuals:', error);
    throw error;
  }
}

async function deleteInvalidIndividuals(invalidIndividuals) {
  console.log('\nDeleting invalid individuals...');
  const results = {
    success: [],
    failed: []
  };

  for (const individual of invalidIndividuals) {
    try {
      await Individual.findByIdAndDelete(individual._id);
      results.success.push({
        id: individual._id,
        name: individual.name,
        iqamaNumber: individual.iqamaNumber
      });
      console.log(`✓ Deleted: ${individual.name} (${individual.iqamaNumber})`);
    } catch (error) {
      results.failed.push({
        id: individual._id,
        name: individual.name,
        iqamaNumber: individual.iqamaNumber,
        error: error.message
      });
      console.error(`✗ Failed to delete: ${individual.name} (${individual.iqamaNumber})`);
    }
  }

  return results;
}

async function main() {
  try {
    await connectDB();

    console.log('Searching for individuals without mainPerson...\n');
    const invalidIndividuals = await findInvalidIndividuals();

    if (invalidIndividuals.length === 0) {
      console.log('No invalid individuals found. All records have mainPerson set correctly.');
      process.exit(0);
    }

    console.log('Found', invalidIndividuals.length, 'individuals without mainPerson:\n');
    invalidIndividuals.forEach((individual, index) => {
      console.log(`${index + 1}. Name: ${individual.name}`);
      console.log(`   Iqama: ${individual.iqamaNumber}`);
      console.log(`   Company: ${individual.company?.name || 'Unknown'}`);
      console.log('---');
    });

    const answer = await question('\nDo you want to delete these individuals? (y/n): ');

    if (answer.toLowerCase() === 'y') {
      const results = await deleteInvalidIndividuals(invalidIndividuals);
      
      console.log('\nDeletion Summary:');
      console.log('----------------');
      console.log(`Successfully deleted: ${results.success.length}`);
      console.log(`Failed to delete: ${results.failed.length}`);

      if (results.failed.length > 0) {
        console.log('\nFailed deletions:');
        results.failed.forEach(failure => {
          console.log(`- ${failure.name} (${failure.iqamaNumber}): ${failure.error}`);
        });
      }
    } else {
      console.log('Operation cancelled. No individuals were deleted.');
    }
  } catch (error) {
    console.error('Error in migration script:', error);
  } finally {
    rl.close();
    await mongoose.connection.close();
    process.exit(0);
  }
}

main(); 