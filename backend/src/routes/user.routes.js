import express from 'express';
import User from '../models/user.model.js';
import { protect } from '../middleware/auth.middleware.js';
import bcryptjs from 'bcryptjs';

const router = express.Router();

// Get all users
router.get('/', protect, async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new user
router.post('/', protect, async (req, res) => {
  try {
    const { username, password, role, mainPerson } = req.body;
    const hashedPassword = await bcryptjs.hash(password, 10);
    
    const user = await User.create({
      username,
      password: hashedPassword,
      isAdmin: role === 'admin',
      allowedMainPersons: mainPerson ? [mainPerson] : [],
      hasIncomeAccess: true
    });

    res.status(201).json({
      _id: user._id,
      username: user.username,
      isAdmin: user.isAdmin,
      allowedMainPersons: user.allowedMainPersons,
      hasIncomeAccess: user.hasIncomeAccess
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Other CRUD routes...

export default router; 