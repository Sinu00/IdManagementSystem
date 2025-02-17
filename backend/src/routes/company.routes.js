import express from 'express';
import { adminProtect } from '../middleware/auth.middleware.js';
import Company from '../models/company.model.js';
import mongoose from 'mongoose';

const router = express.Router();

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
router.get('/:id', async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid company ID' });
    }

    const company = await Company.findById(req.params.id)
      .populate('mainPerson', 'name email contactNumber');

    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    res.json(company);
  } catch (error) {
    next(error);
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
        const daysUntilExpiry = Math.ceil((individual.expiryDate - new Date()) / (1000 * 60 * 60 * 24));
        
        if (daysUntilExpiry <= 5) {
          counts.redCards++;
        } else if (daysUntilExpiry <= 10) {
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

export default router; 