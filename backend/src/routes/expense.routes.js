import express from 'express';
import { protect } from '../middleware/auth.middleware.js';
import Expense from '../models/expense.model.js';

const router = express.Router();

// Get expenses by date range
router.get('/filter/date', protect, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const expenses = await Expense.find({
      createdAt: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    })
    .populate('company', 'name')
    .sort({ createdAt: -1 });
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all expenses
router.get('/', protect, async (req, res) => {
  try {
    const expenses = await Expense.find()
      .populate('company', 'name')
      .sort({ createdAt: -1 });
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get expense by ID
router.get('/:id', protect, async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id)
      .populate('company', 'name');
    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }
    res.json(expense);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new expense
router.post('/', protect, async (req, res) => {
  try {
    const expense = new Expense(req.body);
    const savedExpense = await expense.save();
    const populatedExpense = await Expense.findById(savedExpense._id)
      .populate('company', 'name');
    res.status(201).json(populatedExpense);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update expense
router.put('/:id', protect, async (req, res) => {
  try {
    const expense = await Expense.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    ).populate('company', 'name');
    
    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }
    res.json(expense);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete expense
router.delete('/:id', protect, async (req, res) => {
  try {
    const expense = await Expense.findByIdAndDelete(req.params.id);
    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }
    res.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get filtered expenses
router.post('/filter', protect, async (req, res) => {
  try {
    const { startDate, endDate, company, expenseType } = req.body;
    const query = {};

    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    if (company && company !== 'all') {
      query.company = company;
    }

    if (expenseType && expenseType !== 'all') {
      query.expenseType = expenseType;
    }

    const expenses = await Expense.find(query)
      .populate('company', 'name')
      .sort({ createdAt: -1 });
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;