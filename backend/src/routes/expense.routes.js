import express from 'express';
import { protect } from '../middleware/auth.middleware.js';
import Expense from '../models/expense.model.js';

const router = express.Router();

// Get expenses by date range
router.get('/filter/date', protect, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const expenses = await Expense.find({
      transactionDate: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      },
      mainPerson: { $ne: '67d09798726e5a47c4caf071' }
    })
    .populate('company', 'name crNumber sponserId gosiNumber molNumber')
    .populate('mainPerson', 'name')
    .sort({ transactionDate: -1 });
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
      .sort({ transactionDate: -1 });
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
    // Add transactionDate if not provided
    const expenseData = {
      ...req.body,
      transactionDate: req.body.transactionDate || new Date()
    };
    const expense = new Expense(expenseData);
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
    const { startDate, endDate, company, expenseType, nameSearch, mainPerson } = req.body;
    const EXCLUDED_MAIN_PERSON_ID = '67d09798726e5a47c4caf071'; // Nasser
    
    let query = {};

    // Handle mainPerson filter
    if (mainPerson && mainPerson !== 'all') {
      // Filter by specific mainPerson AND exclude manual expenses (expenseType = 'other')
      query.$and = [
        { mainPerson: mainPerson },
        { expenseType: { $ne: 'other' } }  // Exclude manual expenses
      ];
    } else {
      // "all" selected - exclude Nasser mainPerson only (show all expenseTypes including 'other')
      query.mainPerson = { $ne: EXCLUDED_MAIN_PERSON_ID };
    }

    if (startDate && endDate) {
      if (query.$and) {
        query.$and.push({
          transactionDate: {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
          }
        });
      } else {
        query.transactionDate = {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        };
      }
    }

    if (company && company !== 'all') {
      if (query.$and) {
        query.$and.push({ company: company });
      } else {
        query.company = company;
      }
    }

    if (expenseType && expenseType !== 'all') {
      if (query.$and) {
        query.$and.push({ expenseType: expenseType });
      } else {
        query.expenseType = expenseType;
      }
    }

    if (nameSearch) {
      if (query.$and) {
        query.$and.push({ name: { $regex: nameSearch, $options: 'i' } });
      } else {
        query.name = { $regex: nameSearch, $options: 'i' };
      }
    }

    const expenses = await Expense.find(query)
      .populate('company', 'name')
      .populate('mainPerson', 'name')
      .sort({ transactionDate: -1 });
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;