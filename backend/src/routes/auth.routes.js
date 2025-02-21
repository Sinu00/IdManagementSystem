import express from 'express';
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';

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

export default router; 