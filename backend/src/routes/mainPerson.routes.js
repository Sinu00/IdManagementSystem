import express from 'express';
import { adminProtect } from '../middleware/auth.middleware.js';
import MainPerson from '../models/mainPerson.model.js';

const router = express.Router();

// Get all main persons (Public)
router.get('/', async (req, res) => {
  try {
    const mainPersons = await MainPerson.find();
    res.json(mainPersons);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router; 