import express from 'express';
import { adminProtect } from '../middleware/auth.middleware.js';
import MainPerson from '../models/mainPerson.model.js';
import jwt from 'jsonwebtoken';

const router = express.Router();

// Get all main persons (Public)
router.get('/', async (req, res) => {
  try {
    // Get all main persons regardless of permissions
    const mainPersons = await MainPerson.find();

    // If there's a token, add an 'isAccessible' field to each main person
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const allowedIds = decoded.allowedMainPersons || [];
      
      // Map through main persons and add isAccessible field
      const mainPersonsWithAccess = mainPersons.map(person => ({
        ...person.toObject(),
        isAccessible: allowedIds.includes(person._id.toString())
      }));

      res.json(mainPersonsWithAccess);
    } else {
      // If no token, all main persons are accessible
      const mainPersonsWithAccess = mainPersons.map(person => ({
        ...person.toObject(),
        isAccessible: true
      }));
      res.json(mainPersonsWithAccess);
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router; 