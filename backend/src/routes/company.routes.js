import express from 'express';
import { adminProtect } from '../middleware/auth.middleware.js';
import Company from '../models/company.model.js';
import mongoose from 'mongoose';
import Individual from '../models/individual.model.js';
import Expense from '../models/expense.model.js';

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
    const { mainPerson, crNumber, crAmount } = req.body;

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

    // Create the company
    const company = new Company({
      ...req.body,
      paymentStatus: 'none_paid' // Set initial payment status
    });
    await company.save();
    
    // Create expense entry for CR amount if provided
    if (crAmount > 0) {
      const expense = new Expense({
        name: `CR Amount for ${company.name}`,
        amount: crAmount,
        company: company._id,
        mainPerson: company.mainPerson,
        expenseType: 'cr'
      });
      await expense.save();
    }
    
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

// Process company payment
router.post('/:id/payment', adminProtect, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid company ID' });
    }

    const { paymentType, paymentAmount, resetPayments } = req.body;
    
    // Find the company
    const company = await Company.findById(req.params.id);
    
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }
    
    // Update based on payment type
    if (resetPayments) {
      // For renewal, reset all payment amounts and set status to none_paid
      company.qiwaAmount = 0;
      company.muqeemAmount = 0;
      company.efaAmount = 0;
      company.crAmount = paymentAmount; // Set new CR amount
      company.paymentStatus = 'none_paid';
    } else {
      // For regular payments, update the specific amount
      switch (paymentType) {
        case 'qiwa':
          company.qiwaAmount = paymentAmount;
          break;
        case 'muqeem':
          company.muqeemAmount = paymentAmount;
          break;
        case 'efa':
          company.efaAmount = paymentAmount;
          break;
        default:
          return res.status(400).json({ message: 'Invalid payment type' });
      }
      
      // Check payment status
      const hasQiwa = company.qiwaAmount > 0;
      const hasMuqeem = company.muqeemAmount > 0;
      const hasEfa = company.efaAmount > 0;
      
      if (hasQiwa && hasMuqeem && hasEfa) {
        company.paymentStatus = 'fully_paid';
      } else if (hasQiwa || hasMuqeem || hasEfa) {
        company.paymentStatus = 'partially_paid';
      } else {
        company.paymentStatus = 'none_paid';
      }
    }
    
    // Save the updated company
    await company.save();
    
    // Return the updated company
    const updatedCompany = await Company.findById(req.params.id)
      .populate('mainPerson', 'name email contactNumber');
    
    res.json(updatedCompany);
  } catch (error) {
    console.error('Error processing payment:', error);
    res.status(400).json({ 
      message: error.message || 'Failed to process payment' 
    });
  }
});

// Process Saudi payment
router.post('/:id/saudi-payment', async (req, res) => {
  try {
    const { amount, clear } = req.body;
    const company = await Company.findById(req.params.id);
    
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    if (clear) {
      company.saudiAmount = 0;
      company.saudiCount = 0;
    } else {
      company.saudiAmount += amount;
      company.saudiCount += 1;
    }
    
    await company.save();

    res.json(company);
  } catch (error) {
    res.status(500).json({ message: error.message });
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
export default router; 