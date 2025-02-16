import express from "express";
import { adminProtect } from "../middleware/auth.middleware.js";
import MainPerson from "../models/mainPerson.model.js";

const router = express.Router();

// @route   GET /api/main-persons
// @desc    Get all main persons
// @access  Public
router.get("/", async (req, res) => {
  try {
    const mainPersons = await MainPerson.find({});
    res.json(mainPersons);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// @route   POST /api/main-persons
// @desc    Create a main person
// @access  Admin only
router.post("/", adminProtect, async (req, res) => {
  try {
    const mainPerson = await MainPerson.create(req.body);
    res.status(201).json(mainPerson);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @route   PUT /api/main-persons/:id
// @desc    Update a main person
// @access  Admin only
router.put("/:id", adminProtect, async (req, res) => {
  try {
    const mainPerson = await MainPerson.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!mainPerson) {
      return res.status(404).json({ message: "Main person not found" });
    }
    res.json(mainPerson);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

export default router; 