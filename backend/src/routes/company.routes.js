import express from 'express';
import { adminProtect } from '../middleware/auth.middleware.js';
import Company from '../models/company.model.js';
import mongoose from 'mongoose';
import Individual from '../models/individual.model.js';

const router = express.Router();

// Add the stats route BEFORE other routes that use path parameters
router.get('/stats', async (req, res) => {
  try {
    // Use aggregation to get accurate count
    const individuals = await Individual.aggregate([
      {
        $group: {
          _id: null,
          totalCount: { $sum: 1 },
          uniqueCount: { $addToSet: "$_id" }
        }
      }
    ]);
    
    const totalIndividuals = individuals.length > 0 ? individuals[0].uniqueCount.length : 0;
    
    // Get all individuals for card counting
    const allIndividuals = await Individual.find();
    
    const stats = {
      totalCompanies: await Company.countDocuments(),
      totalIndividuals: totalIndividuals,
      redCards: 0,
      orangeCards: 0,
      greenCards: 0
    };

    // Calculate card statistics
    allIndividuals.forEach(individual => {
      const daysUntilExpiry = Math.ceil(
        (new Date(individual.expiryDate) - new Date()) / (1000 * 60 * 60 * 24)
      );
      
      if (daysUntilExpiry <= 0) {
        stats.redCards++;
      } else if (daysUntilExpiry <= 30) {
        stats.orangeCards++;
      } else {
        stats.greenCards++;
      }
    });


    res.json(stats);
  } catch (error) {
    console.error('Error fetching company stats:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get companies by main person (Public)
router.get('/', async (req, res) => {
  try {
    const { mainPersonId } = req.query;
    const companies = await Company.find({ mainPerson: mainPersonId });
    res.json(companies);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get company by ID
router.get('/:id', async (req, res) => {
  try {
    const company = await Company.findById(req.params.id)
      .populate('mainPerson');
    
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    res.json(company);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create company
router.post('/', adminProtect, async (req, res) => {
  try {
    const { mainPerson, crNumber } = req.body;

    // Check if CR number already exists for this main person
    if (crNumber) {
      const existingCompany = await Company.findOne({
        crNumber,
        mainPerson
      });

      if (existingCompany) {
        return res.status(400).json({
          message: 'CR number already exists for this main person'
        });
      }
    }

    const company = new Company(req.body);
    await company.save();
    
    const populatedCompany = await Company.findById(company._id)
      .populate('mainPerson', 'name email contactNumber');
    
    res.status(201).json(populatedCompany);
  } catch (error) {
    console.error('Error creating company:', error);
    res.status(400).json({ 
      message: error.message || 'Failed to create company' 
    });
  }
});

// Update company
router.put('/:id', adminProtect, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid company ID' });
    }

    const { crNumber, mainPerson } = req.body;

    // Check if CR number already exists for this main person
    if (crNumber) {
      const existingCompany = await Company.findOne({
        crNumber,
        mainPerson,
        _id: { $ne: req.params.id }
      });

      if (existingCompany) {
        return res.status(400).json({
          message: 'CR number already exists for this main person'
        });
      }
    }

    const company = await Company.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('mainPerson', 'name email contactNumber');

    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    res.json(company);
  } catch (error) {
    console.error('Error updating company:', error);
    res.status(400).json({ 
      message: error.message || 'Failed to update company' 
    });
  }
});

// Delete company
router.delete('/:id', adminProtect, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid company ID' });
    }

    const company = await Company.findByIdAndDelete(req.params.id);
    
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    res.json({ message: 'Company deleted successfully' });
  } catch (error) {
    console.error('Error deleting company:', error);
    res.status(500).json({ 
      message: error.message || 'Failed to delete company' 
    });
  }
});

// Update the existing route or add a new one for getting companies by main person
router.get('/main-person/:mainPersonId', async (req, res) => {
  try {
    const { mainPersonId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(mainPersonId)) {
      return res.status(400).json({ message: 'Invalid main person ID' });
    }

    const companies = await Company.find({ mainPerson: mainPersonId })
      .populate('mainPerson', 'name email contactNumber');

    // Calculate card counts for each company
    const companiesWithCounts = await Promise.all(companies.map(async (company) => {
      const individuals = await mongoose.model('Individual').find({ company: company._id });
      
      const counts = {
        redCards: 0,
        orangeCards: 0,
        greenCards: 0,
        totalIndividuals: individuals.length
      };

      individuals.forEach(individual => {
        const daysUntilExpiry = Math.ceil((new Date(individual.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
        
        if (daysUntilExpiry <= 0) {
          counts.redCards++;
        } else if (daysUntilExpiry <= 30) { // Changed from 10 to 30
          counts.orangeCards++;
        } else {
          counts.greenCards++;
        }
      });

      return {
        ...company.toObject(),
        ...counts
      };
    }));

    res.json(companiesWithCounts);
  } catch (error) {
    console.error('Error fetching companies:', error);
    res.status(500).json({ message: error.message });
  }
});

// Add this temporary debug route (remove in production)
router.get('/debug-individuals', async (req, res) => {
  try {
    const duplicates = await Individual.aggregate([
      {
        $group: {
          _id: { iqamaNumber: "$iqamaNumber" },
          count: { $sum: 1 },
          ids: { $push: "$_id" }
        }
      },
      {
        $match: {
          count: { $gt: 1 }
        }
      }
    ]);

    const allIndividuals = await Individual.find().select('_id iqamaNumber company');

    res.json({
      totalCount: allIndividuals.length,
      uniqueCount: new Set(allIndividuals.map(i => i._id.toString())).size,
      possibleDuplicates: duplicates,
      allIndividuals: allIndividuals
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add this temporary cleanup route (remove in production)
router.post('/cleanup-individuals', async (req, res) => {
  try {
    const duplicates = await Individual.aggregate([
      {
        $group: {
          _id: { iqamaNumber: "$iqamaNumber" },
          count: { $sum: 1 },
          ids: { $push: "$_id" }
        }
      },
      {
        $match: {
          count: { $gt: 1 }
        }
      }
    ]);

    // Keep the first occurrence of each duplicate and remove others
    for (const dup of duplicates) {
      const [keepId, ...removeIds] = dup.ids;
      await Individual.deleteMany({ _id: { $in: removeIds } });
    }

    res.json({ message: 'Cleanup completed', removedDuplicates: duplicates.length });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router; 