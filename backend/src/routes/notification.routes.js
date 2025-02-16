import express from 'express';
import Individual from '../models/individual.model.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { days = 10 } = req.query;
    const today = new Date();
    const expiryDate = new Date();
    expiryDate.setDate(today.getDate() + parseInt(days));

    const individuals = await Individual.find({
      expiryDate: { $lte: expiryDate }
    }).populate('company');

    res.json(individuals);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router; 