import express from 'express';
import { adminProtect, protect } from '../middleware/auth.middleware.js';
import Individual from '../models/individual.model.js';
import Company from '../models/company.model.js';
import mongoose from 'mongoose';

const router = express.Router();

// Get individuals by company (Public)
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

    // Count individuals before filtering
    const totalCount = await Individual.countDocuments({ company: companyId });

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { idNumber: { $regex: search, $options: 'i' } }
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
          select: 'name email contactNumber'
        }
      });


    res.json(individuals);
  } catch (error) {
    next(error);
  }
});

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

    const individuals = await Individual.find({ company: companyId });
    res.json(individuals);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Create individual (Admin only)
router.post('/', adminProtect, async (req, res) => {
  try {
    const individualData = {
      ...req.body,
      lastRenewedBy: req.user.id,     // Using req.user.id instead of _id
      lastRenewalDate: new Date()
    };

    const individual = await Individual.create(individualData);
    
    // Populate before sending response
    const populatedIndividual = await Individual.findById(individual._id)
      .populate('company')
      .populate('lastRenewedBy', 'username');  

    res.status(201).json(populatedIndividual);
  } catch (error) {
    console.error('Error creating individual:', error);
    res.status(400).json({ message: error.message });
  }
});

// Update individual (Admin only)
router.put('/:id', adminProtect, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    // Only update lastRenewedBy and lastRenewalDate if it's a renewal operation
    // We can check this by seeing if expiryDate is the only field being updated (along with amount)
    const isRenewalOperation = Object.keys(updates).every(key => 
      ['expiryDate', 'amount'].includes(key)
    );

    if (isRenewalOperation) {
      updates.lastRenewedBy = req.user.id;
      updates.lastRenewalDate = new Date();
    }

    const individual = await Individual.findByIdAndUpdate(
      id,
      updates,
      { new: true }
    )
      .populate('company')
      .populate('lastRenewedBy', 'username');

    res.json(individual);
  } catch (error) {
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
    res.status(500).json({ message: error.message });
  }
});

// Add this new route to get expired IDs by main person
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

// Add this new route to get expiring IDs by main person
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

// Update the get routes to populate lastRenewedBy
router.get('/:id', protect, async (req, res) => {
  try {
    const individual = await Individual.findById(req.params.id)
      .populate('company')
      .populate('lastRenewedBy', 'username');

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

export default router; 