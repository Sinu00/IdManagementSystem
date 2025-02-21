import express from 'express';
import { adminProtect } from '../middleware/auth.middleware.js';
import IqamaPrice from '../models/iqamaPrice.model.js';

const router = express.Router();

// Get current IQAMA price
router.get('/current', async (req, res) => {
  try {
    const currentPrice = await IqamaPrice.findOne().sort({ effectiveDate: -1 });
    if (!currentPrice) {
      // Create initial price if none exists
      const initialPrice = await IqamaPrice.create({
        price: 5000,
        updatedBy: 'system'
      });
      return res.json(initialPrice);
    }
    res.json(currentPrice);
  } catch (error) {
    console.error('Error getting IQAMA price:', error);
    res.status(500).json({ message: 'Failed to get IQAMA price' });
  }
});

// Update IQAMA price (admin only)
router.post('/', adminProtect, async (req, res) => {
  try {
    if (!req.body.price || isNaN(req.body.price) || req.body.price <= 0) {
      return res.status(400).json({ message: 'Invalid price value' });
    }

    const newPrice = await IqamaPrice.create({
      price: req.body.price,
      updatedBy: req.user.username
    });
    res.status(201).json(newPrice);
  } catch (error) {
    console.error('Error updating IQAMA price:', error);
    res.status(500).json({ message: 'Failed to update IQAMA price' });
  }
});

export default router; 