import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Company from '../models/company.model.js';

dotenv.config();

const migrateMakthabToMol = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // First, drop the makthabNumber index if it exists
    try {
      await mongoose.connection.collection('companies').dropIndex('makthabNumber_1');
      console.log('Dropped makthabNumber index');
    } catch (error) {
      if (error.code === 27) {
        console.log('Index does not exist, continuing...');
      } else {
        throw error;
      }
    }

    // Update all documents
    const result = await Company.updateMany(
      {},
      [
        {
          $set: {
            molNumber: {
              $cond: {
                if: { $exists: ['$makthabNumber'] },
                then: '$makthabNumber',
                else: '$molNumber'
              }
            }
          }
        },
        {
          $unset: 'makthabNumber'
        }
      ]
    );

    console.log(`Updated ${result.modifiedCount} documents`);
    
    // Verify the migration
    const remainingMakthabDocs = await Company.countDocuments({
      makthabNumber: { $exists: true }
    });
    
    console.log(`Remaining documents with makthabNumber: ${remainingMakthabDocs}`);
    process.exit(0);
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
};

migrateMakthabToMol(); 