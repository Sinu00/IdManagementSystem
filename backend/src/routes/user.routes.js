import express from 'express';
import User from '../models/user.model.js';
import { adminProtect } from '../middleware/auth.middleware.js';
import bcryptjs from 'bcryptjs';

const router = express.Router();

// Get all users (admin only)
router.get('/', adminProtect, async (req, res) => {
  try {
    const users = await User.find()
      .select('-password')
      .populate('allowedMainPersons', 'name');
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: error.message });
  }
});

// Create new user (admin only)
router.post('/', adminProtect, async (req, res) => {
  try {
    const { username, password, isAdmin, hasIncomeAccess, allowedMainPersons } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ username });
    if (userExists) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    // Hash password
    const hashedPassword = await bcryptjs.hash(password, 10);
    
    // Create user
    const user = await User.create({
      username,
      password: hashedPassword,
      isAdmin: isAdmin || false,
      hasIncomeAccess: hasIncomeAccess || false,
      allowedMainPersons: allowedMainPersons || []
    });

    // Return user without password
    const populatedUser = await User.findById(user._id)
      .select('-password')
      .populate('allowedMainPersons', 'name');

    res.status(201).json(populatedUser);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(400).json({ message: error.message });
  }
});

// Delete user (admin only)
router.delete('/:id', adminProtect, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent deleting yourself
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }

    // Use findByIdAndDelete instead of remove()
    await User.findByIdAndDelete(user._id);
    
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: error.message });
  }
});

// Update user (admin only)
router.put('/:id', adminProtect, async (req, res) => {
  try {
    const { username, password, isAdmin, hasIncomeAccess, allowedMainPersons } = req.body;

    // Check if username already exists for different user
    const existingUser = await User.findOne({ 
      username, 
      _id: { $ne: req.params.id } 
    });
    
    if (existingUser) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    // Prepare update data
    const updateData = {
      username,
      isAdmin,
      hasIncomeAccess,
      allowedMainPersons
    };

    // Only update password if provided
    if (password) {
      updateData.password = await bcryptjs.hash(password, 10);
    }

    // Update user
    const user = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password')
     .populate('allowedMainPersons', 'name');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(400).json({ message: error.message });
  }
});

export default router; 