import express from 'express';
import { adminProtect, protect } from '../middleware/auth.middleware.js';
import Individual from '../models/individual.model.js';
import Company from '../models/company.model.js';
import Income from '../models/income.model.js';
import mongoose from 'mongoose';
import IqamaPrice from '../models/iqamaPrice.model.js';

const router = express.Router();

// Get all individuals (Admin only) - Specifically for AdminNotifications page pending payments
router.get('/all', adminProtect, async (req, res) => {
  try {
    // First get all companies to ensure we have access to all individuals
    const companies = await Company.find();
    const companyIds = companies.map(company => company._id);

    // Get all individuals from all companies
    const individuals = await Individual.find({
      company: { $in: companyIds }
    }).populate({
      path: 'company',
      select: 'name crNumber mainPerson',
      populate: {
        path: 'mainPerson',
        select: 'name'
      }
    }).populate('mainPerson', 'name email contactNumber');

    // Log the count of all individuals and those with pending payments
    const pendingPayments = individuals.filter(ind => {
      const totalPaid = ind.totalPaidAmount || 0;
      const iqamaPrice = ind.iqamaPrice || 5000;
      return totalPaid < iqamaPrice;
    });

    // Log payment-related fields for debugging
    const paymentInfo = individuals.map(ind => ({
      id: ind._id,
      name: ind.name,
      iqamaPrice: ind.iqamaPrice || 5000,
      totalPaidAmount: ind.totalPaidAmount || 0,
      pendingAmount: (ind.iqamaPrice || 5000) - (ind.totalPaidAmount || 0),
      isFullyPaid: (ind.totalPaidAmount || 0) >= (ind.iqamaPrice || 5000)
    }));


    res.json(individuals);
  } catch (error) {
    console.error('Error fetching all individuals:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get expired individuals by main person
router.get('/expired/:mainPersonId', protect, async (req, res) => {
  try {
    const { mainPersonId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(mainPersonId)) {
      return res.status(400).json({ message: 'Invalid main person ID' });
    }

    // Add authorization check
    if (!req.user.isAdmin && !req.user.allowedMainPersons.includes(mainPersonId)) {
      return res.status(403).json({ message: 'Not authorized to access this data' });
    }

    // Get all companies belonging to the main person
    const companies = await Company.find({ mainPerson: mainPersonId });
    const companyIds = companies.map(company => company._id);

    // Find all expired individuals from these companies
    const today = new Date();
    const expiredIndividuals = await Individual.find({
      company: { $in: companyIds },
      expiryDate: { $lt: today }
    }).populate({
      path: 'company',
      select: 'name mainPerson',
      populate: {
        path: 'mainPerson',
        select: 'name'
      }
    }).sort({ expiryDate: 1 });

    res.json(expiredIndividuals);
  } catch (error) {
    console.error('Error fetching expired IDs:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get expiring soon individuals by main person
router.get('/expiring-soon/:mainPersonId', protect, async (req, res) => {
  try {
    const { mainPersonId } = req.params;
    const days = parseInt(req.query.days) || 30; // Default to 30 days if not specified
    
    if (!mongoose.Types.ObjectId.isValid(mainPersonId)) {
      return res.status(400).json({ message: 'Invalid main person ID' });
    }

    // Add authorization check
    if (!req.user.isAdmin && !req.user.allowedMainPersons.includes(mainPersonId)) {
      return res.status(403).json({ message: 'Not authorized to access this data' });
    }

    // Get all companies belonging to the main person
    const companies = await Company.find({ mainPerson: mainPersonId });
    const companyIds = companies.map(company => company._id);

    // Find all individuals expiring in the next X days
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + days);

    const expiringIndividuals = await Individual.find({
      company: { $in: companyIds },
      expiryDate: { 
        $gt: today,
        $lte: futureDate
      }
    }).populate({
      path: 'company',
      select: 'name mainPerson',
      populate: {
        path: 'mainPerson',
        select: 'name'
      }
    }).sort({ expiryDate: 1 });

    // Calculate days until expiry for each individual
    const individualsWithDays = expiringIndividuals.map(individual => {
      const daysUntilExpiry = Math.ceil(
        (new Date(individual.expiryDate) - new Date()) / (1000 * 60 * 60 * 24)
      );
      return {
        ...individual.toObject(),
        daysUntilExpiry
      };
    });

    res.json(individualsWithDays);
  } catch (error) {
    console.error('Error fetching expiring IDs:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get individual by iqama number
router.get('/by-iqama/:iqamaNumber', protect, async (req, res) => {
  try {
    const individual = await Individual.findOne({ 
      iqamaNumber: req.params.iqamaNumber 
    }).populate({
      path: 'company',
      select: 'mainPerson'
    });

    if (!individual) {
      return res.status(404).json({ message: 'Individual not found' });
    }

    res.json(individual);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get individuals by company
router.get('/company/:companyId', protect, async (req, res) => {
  try {
    const { companyId } = req.params;
    const user = req.user;

    // Get the company to check main person
    const company = await Company.findById(companyId)
      .populate('mainPerson');
    
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    // Allow access if:
    // 1. User is admin OR
    // 2. User has access to this company's main person
    if (!user.isAdmin && !user.allowedMainPersons.includes(company.mainPerson._id.toString())) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const individuals = await Individual.find({ company: companyId })
      .populate({
        path: 'company',
        select: 'name address contactNumber mainPerson',
        populate: {
          path: 'mainPerson',
          select: 'name email contactNumber _id'
        }
      });

    res.json(individuals);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get individual by ID
router.get('/:id', protect, async (req, res) => {
  try {
    const individual = await Individual.findById(req.params.id)
      .populate('company')
      .populate('lastUpdatedBy', 'username');

    if (!individual) {
      return res.status(404).json({ message: 'Individual not found' });
    }

    // Add authorization check
    if (!req.user.isAdmin && !req.user.allowedMainPersons.includes(individual.company.mainPerson.toString())) {
      return res.status(403).json({ message: 'Not authorized to access this individual' });
    }

    res.json(individual);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
});

// Get individuals by query parameters
router.get('/', protect, async (req, res, next) => {
  try {
    const { companyId, search, sort, filter } = req.query;
    
    // Validate companyId
    if (!mongoose.Types.ObjectId.isValid(companyId)) {
      return res.status(400).json({ message: 'Invalid company ID' });
    }

    let query = { company: companyId };
    
    // Validate company exists
    const companyExists = await Company.exists({ _id: companyId });
    if (!companyExists) {
      return res.status(404).json({ message: 'Company not found' });
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { iqamaNumber: { $regex: search, $options: 'i' } }
      ];
    }

    if (filter && filter !== 'all') {
      query.status = filter;
    }

    // Build sort options
    let sortOptions = {};
    if (sort === 'name') {
      sortOptions.name = 1;
    } else if (sort === 'recent') {
      sortOptions.createdAt = -1;
    } else if (sort === 'expiry') {
      sortOptions.expiryDate = 1;
    }

    const individuals = await Individual.find(query)
      .sort(sortOptions)
      .populate({
        path: 'company',
        select: 'name address contactNumber mainPerson',
        populate: {
          path: 'mainPerson',
          select: 'name email contactNumber _id'
        }
      });

    res.json(individuals);
  } catch (error) {
    next(error);
  }
});

// Create new individual
router.post('/', protect, async (req, res) => {
  try {
    const currentPrice = await IqamaPrice.findOne().sort({ effectiveDate: -1 });
    const iqamaPrice = currentPrice?.price || 5000;
    const initialPayment = parseFloat(req.body.amount) || 0;
    
    // Get company to set mainPerson
    const company = await Company.findById(req.body.company);
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }
    
    // Calculate payment status
    const pendingAmount = iqamaPrice - initialPayment;
    const isFullyPaid = initialPayment === iqamaPrice;
    
    const individual = await Individual.create({
      ...req.body,
      mainPerson: company.mainPerson, // Set mainPerson from company
      iqamaPrice,
      totalPaidAmount: initialPayment,
      pendingAmount,
      isFullyPaid,
      referredBy: req.body.referredBy || req.user.username, 
      lastUpdatedBy: req.user.username,
      lastUpdateDate: new Date(),
      paymentHistory: initialPayment > 0 ? [{
        amount: initialPayment,
        paidBy: req.user.username,
        paidAt: new Date(),
        remainingAmount: pendingAmount
      }] : []
    });

    // Create income record if payment is made
    if (initialPayment > 0) {
      await Income.create({
        name: individual.name,
        iqamaNumber: individual.iqamaNumber,
        amount: initialPayment,
        referredBy: individual.referredBy, // Use the individual's referredBy
        mainPerson: company.mainPerson // Use company's mainPerson
      });
    }

    res.status(201).json(individual);
  } catch (error) {
    console.error('Error creating individual:', error);
    res.status(400).json({ message: error.message });
  }
});

// Handle pending payment
router.post('/:id/pay-pending', protect, async (req, res) => {
  try {
    const individual = await Individual.findById(req.params.id);
    if (!individual) {
      return res.status(404).json({ message: 'Individual not found' });
    }

    const paymentAmount = parseFloat(req.body.amount) || 0;
    if (paymentAmount <= 0) {
      return res.status(400).json({ message: 'Invalid payment amount' });
    }

    // Calculate new payment status
    const newTotalPaid = individual.totalPaidAmount + paymentAmount;
    
    // Don't allow overpayment
    if (newTotalPaid > individual.iqamaPrice) {
      return res.status(400).json({ message: 'Payment amount exceeds required amount' });
    }

    const newPendingAmount = individual.iqamaPrice - newTotalPaid;
    const isFullyPaid = newTotalPaid === individual.iqamaPrice; // Exact match required
    
    // Update individual payment details
    individual.totalPaidAmount = newTotalPaid;
    individual.pendingAmount = newPendingAmount;
    individual.isFullyPaid = isFullyPaid;
    individual.lastUpdatedBy = req.user.username;
    individual.lastUpdateDate = new Date();
    
    individual.paymentHistory.push({
      amount: paymentAmount,
      paidBy: req.user.username,
      paidAt: new Date(),
      remainingAmount: newPendingAmount
    });

    await individual.save();

    // Create income record for the payment
    const company = await Company.findById(individual.company).populate('mainPerson');
    await Income.create({
      name: individual.name,
      iqamaNumber: individual.iqamaNumber,
      amount: paymentAmount,
      referredBy: individual.referredBy || '',
      addedBy: req.user.username,
      dateAndTime: new Date(),
      notes: 'Pending payment',
      mainPerson: company.mainPerson._id
    });

    res.json(individual);
  } catch (error) {
    console.error('Error processing payment:', error);
    res.status(400).json({ message: error.message });
  }
});

// Update individual (including renewal)
router.put('/:id', protect, async (req, res) => {
  try {
    const individual = await Individual.findById(req.params.id);
    if (!individual) {
      return res.status(404).json({ message: 'Individual not found' });
    }

    // Get company to ensure mainPerson is set
    const company = await Company.findById(req.body.company || individual.company);
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    // Check if this is a renewal operation
    if (req.body.expiryDate && req.body.isRenewal) {
      const currentPrice = await IqamaPrice.findOne().sort({ effectiveDate: -1 });
      const iqamaPrice = currentPrice?.price || 5000;
      const renewalPayment = parseFloat(req.body.totalPaidAmount) || 0;
      
      // Calculate payment status for new period
      const pendingAmount = iqamaPrice - renewalPayment;
      const isFullyPaid = renewalPayment === iqamaPrice;
      
      // Reset payment status for new period
      req.body.iqamaPrice = iqamaPrice;
      req.body.totalPaidAmount = renewalPayment;
      req.body.pendingAmount = pendingAmount;
      req.body.isFullyPaid = isFullyPaid;

      if (renewalPayment > 0) {
        await Income.create({
          name: individual.name,
          iqamaNumber: individual.iqamaNumber,
          amount: renewalPayment,
          referredBy: individual.referredBy, // Use the original referredBy
          mainPerson: company.mainPerson
        });

        req.body.paymentHistory = [{
          amount: renewalPayment,
          paidBy: req.user.username,
          paidAt: new Date(),
          remainingAmount: pendingAmount
        }];
      }
    } else {
      // For regular updates, remove payment-related fields
      delete req.body.iqamaPrice;
      delete req.body.totalPaidAmount;
      delete req.body.pendingAmount;
      delete req.body.isFullyPaid;
      delete req.body.paymentHistory;
    }

    // Remove isRenewal flag and ensure mainPerson is set
    delete req.body.isRenewal;
    req.body.mainPerson = company.mainPerson;

    // Keep the original referredBy if not explicitly changed
    if (!req.body.referredBy) {
      delete req.body.referredBy;
    }

    const updatedIndividual = await Individual.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
        lastUpdatedBy: req.user.username,
        lastUpdateDate: new Date()
      },
      { 
        new: true,
        runValidators: true 
      }
    ).populate({
      path: 'company',
      select: 'name address contactNumber mainPerson',
      populate: {
        path: 'mainPerson',
        select: 'name email contactNumber _id'
      }
    });

    res.json(updatedIndividual);
  } catch (error) {
    console.error('Error updating individual:', error);
    res.status(400).json({ message: error.message });
  }
});

// Delete individual (Admin only)
router.delete('/:id', adminProtect, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid individual ID' });
    }

    const individual = await Individual.findByIdAndDelete(id);
    if (!individual) {
      return res.status(404).json({ message: 'Individual not found' });
    }

    res.json({ message: 'Individual deleted successfully' });
  } catch (error) {
    console.error('Error deleting individual:', error);
    res.status(500).json({ message: error.message });
  }
});

export default router; 