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
      },
      mainPerson: { $ne: '67d09798726e5a47c4caf071' }
    })
    .populate('company', 'name crNumber sponserId gosiNumber molNumber')
    .populate('mainPerson', 'name')
    .sort({ createdAt: -1 });
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all expenses
router.get('/', protect, async (req, res) => {
  try {
    const expenses = await Expense.find({
      mainPerson: { $ne: '67d09798726e5a47c4caf071' }
    })
      .populate('company', 'name crNumber sponserId gosiNumber molNumber')
      .populate('mainPerson', 'name')
      .sort({ createdAt: -1 });
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get expense by ID
router.get('/:id', protect, async (req, res) => {
  try {
    const expense = await Expense.findOne({
      _id: req.params.id,
      mainPerson: { $ne: '67d09798726e5a47c4caf071' }
    })
      .populate('company', 'name crNumber sponserId gosiNumber molNumber')
      .populate('company', 'name')
      .populate('mainPerson', 'name');
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
      .populate('company', 'name')
      .populate('mainPerson', 'name');
    res.status(201).json(populatedExpense);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update expense
router.put('/:id', protect, async (req, res) => {
  try {
    const expense = await Expense.findOneAndUpdate(
      {
        _id: req.params.id,
        mainPerson: { $ne: '67d09798726e5a47c4caf071' }
      },
      req.body,
      { new: true }
    ).populate('company', 'name')
     .populate('mainPerson', 'name');
    
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
    const expense = await Expense.findOneAndDelete({
      _id: req.params.id,
      mainPerson: { $ne: '67d09798726e5a47c4caf071' }
    });
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
    const query = {
      mainPerson: { $ne: '67d09798726e5a47c4caf071' }
    };

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
      .populate('mainPerson', 'name')
      .sort({ createdAt: -1 });
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;