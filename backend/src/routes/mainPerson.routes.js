import express from 'express';
import { adminProtect } from '../middleware/auth.middleware.js';
import MainPerson from '../models/mainPerson.model.js';
import jwt from 'jsonwebtoken';

const router = express.Router();

// Get all main persons (Public)
router.get('/', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    let mainPersons;
    
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (decoded.allowedMainPersons) {
        mainPersons = await MainPerson.find({
          _id: { $in: decoded.allowedMainPersons }
        });
      }
    } else {
      mainPersons = await MainPerson.find();
    }

    res.json(mainPersons);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router; 