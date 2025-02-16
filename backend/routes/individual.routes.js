import express from "express";
import { adminProtect } from "../middleware/auth.middleware.js";
import Individual from "../models/individual.model.js";

const router = express.Router();

// @route   GET /api/individuals
// @desc    Get individuals with filters
// @access  Public
router.get("/", async (req, res) => {
  try {
    const { companyId, search, sort, order } = req.query;
    
    // Build query
    let query = companyId ? { company: companyId } : {};
    if (search) {
      query = {
        ...query,
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { idNumber: { $regex: search, $options: 'i' } }
        ]
      };
    }

    // Build sort
    let sortOptions = {};
    if (sort) {
      sortOptions[sort] = order === 'desc' ? -1 : 1;
    }

    const individuals = await Individual.find(query)
      .sort(sortOptions)
      .populate({
        path: 'company',
        select: 'name',
        populate: { path: 'mainPerson', select: 'name' }
      });

    res.json(individuals);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// @route   GET /api/individuals/:id
// @desc    Get individual by ID
// @access  Public
router.get("/:id", async (req, res) => {
  try {
    const individual = await Individual.findById(req.params.id)
      .populate({
        path: 'company',
        select: 'name',
        populate: { path: 'mainPerson', select: 'name' }
      });

    if (!individual) {
      return res.status(404).json({ message: "Individual not found" });
    }
    res.json(individual);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// @route   POST /api/individuals
// @desc    Create an individual
// @access  Admin
router.post("/", adminProtect, async (req, res) => {
  try {
    const individual = await Individual.create(req.body);
    res.status(201).json(individual);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @route   PUT /api/individuals/:id
// @desc    Update an individual
// @access  Admin
router.put("/:id", adminProtect, async (req, res) => {
  try {
    const individual = await Individual.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!individual) {
      return res.status(404).json({ message: "Individual not found" });
    }
    res.json(individual);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @route   DELETE /api/individuals/:id
// @desc    Delete an individual
// @access  Admin
router.delete("/:id", adminProtect, async (req, res) => {
  try {
    const individual = await Individual.findByIdAndDelete(req.params.id);
    if (!individual) {
      return res.status(404).json({ message: "Individual not found" });
    }
    res.json({ message: "Individual deleted successfully" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

export default router; 