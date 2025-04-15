import express from 'express';
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ 
      username: { $regex: new RegExp(`^${username}$`, 'i') } 
    });

    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { 
        id: user._id, 
        username: user.username,
        isAdmin: user.isAdmin,
        allowedMainPersons: user.allowedMainPersons || [],
        hasIncomeAccess: user.hasIncomeAccess
      },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({ 
      token,
      user: {
        username: user.username,
        isAdmin: user.isAdmin,
        hasIncomeAccess: user.hasIncomeAccess
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add refresh token endpoint
router.post('/refresh-token', protect, async (req, res) => {
  try {
    // Get the user from the protect middleware
    const user = req.user;

    // Generate new token
    const token = jwt.sign(
      { 
        id: user._id, 
        username: user.username,
        isAdmin: user.isAdmin,
        allowedMainPersons: user.allowedMainPersons || [],
        hasIncomeAccess: user.hasIncomeAccess
      },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({ token });
  } catch (error) {
    console.error('Error refreshing token:', error);
    res.status(500).json({ message: 'Failed to refresh token' });
  }
});

export default router; 