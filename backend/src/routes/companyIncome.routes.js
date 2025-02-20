import express from 'express';
import { protect } from '../middleware/auth.middleware.js';
import CompanyIncome from '../models/companyIncome.model.js';

const router = express.Router();

// Get all income for a company
router.get('/:companyId', protect, async (req, res) => {
  try {
    const incomes = await CompanyIncome.find({ company: req.params.companyId })
      .sort({ dateAndTime: -1 })
      .populate('addedBy', 'username');
    res.json(incomes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add new income
router.post('/', protect, async (req, res) => {
  try {
    const income = await CompanyIncome.create({
      ...req.body,
      addedBy: req.user.username,
      dateAndTime: req.body.dateAndTime || new Date()
    });
    res.status(201).json(income);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get income by date range
router.get('/:companyId/filter', protect, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const incomes = await CompanyIncome.find({
      company: req.params.companyId,
      dateAndTime: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    })
      .sort({ dateAndTime: -1 })
      .populate('addedBy', 'username');
    res.json(incomes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router; 