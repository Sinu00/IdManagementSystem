import express from 'express';
import { adminProtect } from '../middleware/auth.middleware.js';
import Individual from '../models/individual.model.js';
import Company from '../models/company.model.js';
import mongoose from 'mongoose';

const router = express.Router();

// Get individuals by company (Public)
router.get('/', async (req, res, next) => {
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
    console.log('Total individuals for company:', totalCount);

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

    console.log('Query results:', {
      count: individuals.length,
      sampleIds: individuals.slice(0, 2).map(i => i._id),
      sampleData: individuals.slice(0, 1).map(i => ({
        name: i.name,
        company: i.company?.name,
        mainPerson: i.company?.mainPerson?.name
      }))
    });

    res.json(individuals);
  } catch (error) {
    next(error);
  }
});

router.get('/company/:companyId', async (req, res) => {
  try {
    const { companyId } = req.params;
    
    // Validate companyId
    if (!mongoose.Types.ObjectId.isValid(companyId)) {
      return res.status(400).json({ message: 'Invalid company ID' });
    }

    const individuals = await Individual.find({ company: companyId })
      .populate({
        path: 'company',
        select: 'name crNumber'
      });

    res.json(individuals);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router; 