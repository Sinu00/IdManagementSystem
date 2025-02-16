import express from "express";
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import bcrypt from "bcryptjs";

const router = express.Router();

// @route   POST /api/auth/admin/login
// @desc    Admin login
// @access  Public
router.post("/admin/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    
    const user = await User.findOne({ username });
    
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      token,
      username: user.username,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Add this route temporarily and remove after creating the first admin
router.post("/setup", async (req, res) => {
  try {
    const { username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const admin = await User.create({
      username,
      password: hashedPassword,
      role: "admin"
    });
    res.status(201).json({ message: "Admin user created" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

export default router; 