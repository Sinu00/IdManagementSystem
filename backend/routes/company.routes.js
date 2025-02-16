import express from "express";
import { adminProtect } from "../middleware/auth.middleware.js";
import Company from "../models/company.model.js";

const router = express.Router();

// @route   GET /api/companies
// @desc    Get companies by mainPerson
// @access  Public
router.get("/", async (req, res) => {
  try {
    const { mainPersonId } = req.query;
    const query = mainPersonId ? { mainPerson: mainPersonId } : {};
    const companies = await Company.find(query).populate("mainPerson", "name");
    res.json(companies);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// @route   GET /api/companies/:id
// @desc    Get company by ID
// @access  Public
router.get("/:id", async (req, res) => {
  try {
    const company = await Company.findById(req.params.id).populate("mainPerson", "name");
    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }
    res.json(company);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// @route   POST /api/companies
// @desc    Create a company
// @access  Admin
router.post("/", adminProtect, async (req, res) => {
  try {
    const company = await Company.create(req.body);
    res.status(201).json(company);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @route   PUT /api/companies/:id
// @desc    Update a company
// @access  Admin
router.put("/:id", adminProtect, async (req, res) => {
  try {
    const company = await Company.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }
    res.json(company);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @route   DELETE /api/companies/:id
// @desc    Delete a company
// @access  Admin
router.delete("/:id", adminProtect, async (req, res) => {
  try {
    const company = await Company.findByIdAndDelete(req.params.id);
    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }
    res.json({ message: "Company deleted successfully" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

export default router; 