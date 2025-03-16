import express from 'express';
import { protect } from '../middleware/auth.middleware.js';
import Income from '../models/income.model.js';
import User from '../models/user.model.js';
import mongoose from 'mongoose';

const router = express.Router();

// Define the excluded mainPerson ID as a constant
const EXCLUDED_MAIN_PERSON_ID = "67d09798726e5a47c4caf071";

// Helper function to add mainPerson filter
const addMainPersonFilter = (query) => {
  return {
    ...query,
    mainPerson: { $ne: EXCLUDED_MAIN_PERSON_ID }
  };
};

// Get incomes by date range
router.get('/filter/date', protect, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const query = {
      $and: [
        { mainPerson: { $ne: EXCLUDED_MAIN_PERSON_ID } },
        {
          $or: [
            {
              createdAt: {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
              }
            },
            {
              dateAndTime: {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
              }
            }
          ]
        }
      ]
    };

    const incomes = await Income.find(query)
      .sort({ createdAt: -1 })
      .populate('mainPerson', 'name');
    res.json(incomes);
  } catch (error) {
    console.error('Error in filter/date:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get all incomes
router.get('/', protect, async (req, res) => {
  try {
    const incomes = await Income.find({ 
      mainPerson: { $ne: EXCLUDED_MAIN_PERSON_ID } 
    })
    .sort({ createdAt: -1 })
    .populate('mainPerson', 'name');
    res.json(incomes);
  } catch (error) {
    console.error('Error in get all:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get unique referred by list
router.get('/referred-by', protect, async (req, res) => {
  try {
    const users = await User.find({}, 'username');
    const usernames = users.map(user => user.username);
    res.json(usernames);
  } catch (error) {
    console.error('Error in referred-by:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get income by ID
router.get('/:id', protect, async (req, res) => {
  try {
    const income = await Income.findById(req.params.id);
    if (!income) {
      return res.status(404).json({ message: 'Income not found' });
    }
    res.json(income);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new income
router.post('/', protect, async (req, res) => {
  try {
    const income = new Income({
      ...req.body
    });
    const savedIncome = await income.save();
    res.status(201).json(savedIncome);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update income
router.put('/:id', protect, async (req, res) => {
  try {
    const income = await Income.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!income) {
      return res.status(404).json({ message: 'Income not found' });
    }
    res.json(income);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete income
router.delete('/:id', protect, async (req, res) => {
  try {
    const income = await Income.findByIdAndDelete(req.params.id);
    if (!income) {
      return res.status(404).json({ message: 'Income not found' });
    }
    res.json({ message: 'Income deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get filtered income
router.post('/filter', protect, async (req, res) => {
  try {
    const { startDate, endDate, referredBy } = req.body;
    let query = {
      $and: [
        { mainPerson: { $ne: EXCLUDED_MAIN_PERSON_ID } },
        {
          createdAt: {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
          }
        }
      ]
    };

    if (referredBy) {
      query.$and.push({ referredBy: referredBy });
    }

    const incomes = await Income.find(query)
      .sort({ createdAt: -1 })
      .populate('mainPerson', 'name');
    res.json(incomes);
  } catch (error) {
    console.error('Error in filter:', error);
    res.status(500).json({ message: error.message });
  }
});

export default router;