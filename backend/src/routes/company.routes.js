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

export default router; 