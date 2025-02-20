import express from 'express';
import { protect } from '../middleware/auth.middleware.js';
import CompanyExpense from '../models/companyExpense.model.js';

const router = express.Router();

// Get all expenses for a company
router.get('/:companyId', protect, async (req, res) => {
  try {
    const expenses = await CompanyExpense.find({ company: req.params.companyId })
      .sort({ dateAndTime: -1 });
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add new expense
router.post('/', protect, async (req, res) => {
  try {
    const expense = await CompanyExpense.create({
      ...req.body,
      dateAndTime: req.body.dateAndTime || new Date()
    });
    res.status(201).json(expense);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get expenses by date range
router.get('/:companyId/filter', protect, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const expenses = await CompanyExpense.find({
      company: req.params.companyId,
      dateAndTime: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    }).sort({ dateAndTime: -1 });
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router; 