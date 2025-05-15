import express from 'express';
import { adminProtect, protect } from '../middleware/auth.middleware.js';
import Company from '../models/company.model.js';
import mongoose from 'mongoose';
import Individual from '../models/individual.model.js';
import Expense from '../models/expense.model.js';
import NotifyCompanyAdmin from '../models/notifyCompanyAdmin.model.js';

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
router.get('/', protect, async (req, res) => {
  try {
    const { mainPersonId } = req.query;
    const companies = await Company.find({ mainPerson: mainPersonId });
    res.json(companies);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get company by ID
router.get('/:id', protect, async (req, res) => {
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
router.post('/', protect, async (req, res) => {
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

    // If user is admin, create company directly
    if (req.user.isAdmin) {
      const company = new Company({
        ...req.body,
        paymentStatus: 'none_paid'
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
      
      return res.status(201).json(populatedCompany);
    }

    // For normal users, create a notification
    const notification = new NotifyCompanyAdmin({
      ...req.body,
      requestType: 'ADD',
      addedBy: req.user._id,
      amount: crAmount || 0
    });

    await notification.save();
    const populatedNotification = await NotifyCompanyAdmin.findById(notification._id)
      .populate('mainPerson', 'name email contactNumber')
      .populate('addedBy', 'username');

    res.status(201).json({
      message: 'Company creation request sent for approval',
      notification: populatedNotification
    });
  } catch (error) {
    console.error('Error creating company:', error);
    res.status(400).json({ 
      message: error.message || 'Failed to create company' 
    });
  }
});

// Update company
router.put('/:id', protect, async (req, res) => {
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

    // Only admin can update company details
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Only admin can update company details' });
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
router.post('/:id/payment', protect, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid company ID' });
    }

    const { paymentType, paymentAmount, isRenewal, resetPayments, clear } = req.body;
    
    // Find the company
    const company = await Company.findById(req.params.id);
    
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    // If user is admin, process payment directly
    if (req.user.isAdmin) {
      // Handle renewal case
      if (isRenewal && paymentType === 'cr') {
        company.crAmount = paymentAmount;
        if (resetPayments) {
          company.qiwaAmount = 0;
          company.muqeemAmount = 0;
          company.efaAmount = 0;
          company.paymentStatus = 'none_paid';
        }
      } else {
        // Regular payment update
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
          case 'saudi':
            if (clear) {
              company.saudiAmount = 0;
              company.saudiCount = 0;
            } else {
              company.saudiAmount = (company.saudiAmount || 0) + paymentAmount;
              company.saudiCount = (company.saudiCount || 0) + 1;
            }
            break;
          case 'cr':
            company.crAmount = paymentAmount;
            break;
          default:
            return res.status(400).json({ message: 'Invalid payment type' });
        }
        
        // Check payment status for non-saudi payments
        if (paymentType !== 'saudi') {
          const hasQiwa = company.qiwaAmount > 0;
          const hasMuqeem = company.muqeemAmount > 0;
          const hasEfa = company.efaAmount > 0;
          
          if (hasQiwa && hasMuqeem && hasEfa) {
            company.paymentStatus = 'fully_paid';
          } else if (hasQiwa || hasMuqeem || hasEfa) {
            company.paymentStatus = 'partially_paid';
          }
        }
      }
      
      await company.save();

      // Create expense entry only if not clearing Saudi payment
      if (!(paymentType === 'saudi' && clear)) {
        const expense = new Expense({
          name: isRenewal 
            ? `CR Renewal Payment for ${company.name}`
            : `${paymentType.toUpperCase()} Payment for ${company.name}`,
          amount: paymentAmount,
          company: company._id,
          mainPerson: company.mainPerson,
          expenseType: paymentType,
          specification: isRenewal ? 'Renewal CR Payment' : `Regular ${paymentType.toUpperCase()} Payment`,
          transactionDate: new Date()
        });
        await expense.save();
      }
      
      // Return the updated company
      const updatedCompany = await Company.findById(req.params.id)
        .populate('mainPerson', 'name email contactNumber');
      
      return res.json(updatedCompany);
    }

    // For normal users, create a payment notification
    const notification = new NotifyCompanyAdmin({
      name: company.name,
      crNumber: company.crNumber,
      sponserId: company.sponserId,
      gosiNumber: company.gosiNumber,
      molNumber: company.molNumber,
      mainPerson: company.mainPerson,
      requestType: 'PAYMENT',
      paymentType,
      amount: paymentAmount,
      addedBy: req.user._id,
      originalCompany: company._id
    });

    await notification.save();
    const populatedNotification = await NotifyCompanyAdmin.findById(notification._id)
      .populate('mainPerson', 'name email contactNumber')
      .populate('addedBy', 'username')
      .populate('originalCompany', 'name');

    res.json({
      message: 'Payment request sent for approval',
      notification: populatedNotification
    });
  } catch (error) {
    console.error('Error processing payment:', error);
    res.status(400).json({ 
      message: error.message || 'Failed to process payment' 
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
router.get('/main-person/:mainPersonId', protect, async (req, res) => {
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
        } else if (daysUntilExpiry <= 30) {
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

// Bulk migration route for companies and individuals
router.post('/bulk-migrate', protect, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { mainPersonId, companies } = req.body;

    if (!mainPersonId || !companies || !Array.isArray(companies)) {
      return res.status(400).json({ message: 'Invalid request format' });
    }

    const results = {
      companies: [],
      individuals: []
    };

    // Process each company
    for (const companyData of companies) {
      const { 
        name, 
        crNumber, 
        sponserId, 
        gosiNumber, 
        molNumber, 
        crAmount,
        qiwaAmount,
        muqeemAmount,
        efaAmount,
        saudiAmount,
        individuals 
      } = companyData;

      // Create company with all amount fields
      const company = new Company({
        name,
        crNumber,
        sponserId,
        gosiNumber,
        molNumber,
        crAmount: crAmount || 0,
        qiwaAmount: qiwaAmount || 0,
        muqeemAmount: muqeemAmount || 0,
        efaAmount: efaAmount || 0,
        saudiAmount: saudiAmount || 0,
        mainPerson: mainPersonId,
        paymentStatus: 'none_paid'
      });

      await company.save({ session });
      results.companies.push(company);

      // Process individuals if provided
      if (individuals && Array.isArray(individuals)) {
        for (const individualData of individuals) {
          const { amount = 0, iqamaPrice = 5000 } = individualData;
          
          // Create individual with payment information
          const individual = new Individual({
            ...individualData,
            company: company._id,
            mainPerson: mainPersonId,
            totalPaidAmount: amount || 0,
            iqamaPrice: iqamaPrice,
            pendingAmount: iqamaPrice - (amount || 0),
            isFullyPaid: (amount || 0) >= iqamaPrice,
            paymentHistory: amount > 0 ? [{
              amount: amount,
              paidBy: req.user.username,
              paidAt: new Date()
            }] : []
          });

          await individual.save({ session });
          results.individuals.push(individual);
        }
      }
    }

    await session.commitTransaction();
    res.status(201).json(results);
  } catch (error) {
    await session.abortTransaction();
    console.error('Bulk migration error:', error);
    res.status(400).json({ 
      message: error.message || 'Failed to process bulk migration'
    });
  } finally {
    session.endSession();
  }
});

export default router; 