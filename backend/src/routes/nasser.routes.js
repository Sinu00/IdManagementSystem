import express from 'express';
import { protect } from '../middleware/auth.middleware.js';
import Income from '../models/income.model.js';
import Expense from '../models/expense.model.js';
import User from '../models/user.model.js';
import mongoose from 'mongoose';

const router = express.Router();

// Define the Nasser mainPerson ID as a constant
const NASSER_MAIN_PERSON_ID = "67d09798726e5a47c4caf071";

// Get Nasser's incomes
router.get('/income', protect, async (req, res) => {
  try {
    const incomes = await Income.find({ 
      mainPerson: NASSER_MAIN_PERSON_ID
    })
    .sort({ createdAt: -1 })
    .populate('mainPerson', 'name');
    res.json(incomes);
  } catch (error) {
    console.error('Error in get Nasser income:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get unique referred by list
router.get('/income/referred-by', protect, async (req, res) => {
  try {
    const users = await User.find({}, 'username');
    const usernames = users.map(user => user.username);
    res.json(usernames);
  } catch (error) {
    console.error('Error in referred-by:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get Nasser's incomes by date range
router.get('/income/filter/date', protect, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const query = {
      $and: [
        { mainPerson: NASSER_MAIN_PERSON_ID },
        {
          transactionDate: {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
              }
        }
      ]
    };

    const incomes = await Income.find(query)
      .sort({ transactionDate: -1 })
      .populate('mainPerson', 'name');
    res.json(incomes);
  } catch (error) {
    console.error('Error in filter/date:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get Nasser's filtered income
router.post('/income/filter', protect, async (req, res) => {
  try {
    const { startDate, endDate, referredBy } = req.body;
    let query = {
      $and: [
        { mainPerson: NASSER_MAIN_PERSON_ID },
        {
          transactionDate: {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
          }
        }
      ]
    };

    if (referredBy && referredBy !== 'all') {
      query.$and.push({ referredBy: referredBy });
    }

    const incomes = await Income.find(query)
      .sort({ transactionDate: -1 })
      .populate('mainPerson', 'name');
    res.json(incomes);
  } catch (error) {
    console.error('Error in filter:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get Nasser's expenses
router.get('/expense', protect, async (req, res) => {
  try {
    const expenses = await Expense.find({
      mainPerson: NASSER_MAIN_PERSON_ID
    })
      .populate('company', 'name crNumber sponserId gosiNumber molNumber')
      .populate('mainPerson', 'name')
      .sort({ createdAt: -1 });
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get Nasser's expenses by date range
router.get('/expense/filter/date', protect, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const expenses = await Expense.find({
      createdAt: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      },
      mainPerson: NASSER_MAIN_PERSON_ID
    })
    .populate('company', 'name crNumber sponserId gosiNumber molNumber')
    .populate('mainPerson', 'name')
    .sort({ createdAt: -1 });
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get Nasser's filtered expenses
router.post('/expense/filter', protect, async (req, res) => {
  try {
    const { startDate, endDate, company, expenseType } = req.body;
    const query = {
      mainPerson: NASSER_MAIN_PERSON_ID
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

// Create a new record (income or expense)
router.post('/record', protect, async (req, res) => {
  try {
    const { type, ...data } = req.body;
    data.mainPerson = NASSER_MAIN_PERSON_ID;

    let record;
    if (type === 'income') {
      record = new Income(data);
    } else {
      record = new Expense(data);
    }

    await record.save();
    res.status(201).json(record);
  } catch (error) {
    console.error('Error creating record:', error);
    res.status(500).json({ message: error.message });
  }
});

// Update a record
router.put('/record/:id', protect, async (req, res) => {
  try {
    const { id } = req.params;
    const { type, ...data } = req.body;
    
    let record;
    if (type === 'income') {
      record = await Income.findOneAndUpdate(
        { _id: id, mainPerson: NASSER_MAIN_PERSON_ID },
        data,
        { new: true }
      );
    } else {
      record = await Expense.findOneAndUpdate(
        { _id: id, mainPerson: NASSER_MAIN_PERSON_ID },
        data,
        { new: true }
      );
    }

    if (!record) {
      return res.status(404).json({ message: 'Record not found' });
    }

    res.json(record);
  } catch (error) {
    console.error('Error updating record:', error);
    res.status(500).json({ message: error.message });
  }
});

// Delete a record
router.delete('/record/:id', protect, async (req, res) => {
  try {
    const { id } = req.params;
    const { type } = req.query;

    let record;
    if (type === 'income') {
      record = await Income.findOneAndDelete({
        _id: id,
        mainPerson: NASSER_MAIN_PERSON_ID
      });
    } else {
      record = await Expense.findOneAndDelete({
        _id: id,
        mainPerson: NASSER_MAIN_PERSON_ID
      });
    }

    if (!record) {
      return res.status(404).json({ message: 'Record not found' });
    }

    res.json({ message: 'Record deleted successfully' });
  } catch (error) {
    console.error('Error deleting record:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get a record by ID
router.get('/record/:id', protect, async (req, res) => {
  try {
    const { id } = req.params;
    const { type } = req.query;

    let record;
    if (type === 'income') {
      record = await Income.findOne({
        _id: id,
        mainPerson: NASSER_MAIN_PERSON_ID
      });
    } else {
      record = await Expense.findOne({
        _id: id,
        mainPerson: NASSER_MAIN_PERSON_ID
      });
    }

    if (!record) {
      return res.status(404).json({ message: 'Record not found' });
    }

    res.json(record);
  } catch (error) {
    console.error('Error fetching record:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get Nasser's total balance (all time)
router.get('/total-balance', protect, async (req, res) => {
  try {
    // Get total income
    const totalIncome = await Income.aggregate([
      { $match: { mainPerson: new mongoose.Types.ObjectId(NASSER_MAIN_PERSON_ID) } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);

    // Get total expense
    const totalExpense = await Expense.aggregate([
      { $match: { mainPerson: new mongoose.Types.ObjectId(NASSER_MAIN_PERSON_ID) } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);

    const balance = {
      totalIncome: totalIncome[0]?.total || 0,
      totalExpense: totalExpense[0]?.total || 0,
      netBalance: (totalIncome[0]?.total || 0) - (totalExpense[0]?.total || 0)
    };

    res.json(balance);
  } catch (error) {
    console.error('Error calculating Nasser total balance:', error);
    res.status(500).json({ message: error.message });
  }
});

export default router; 