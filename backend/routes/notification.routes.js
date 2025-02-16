import express from "express";
import Individual from "../models/individual.model.js";

const router = express.Router();

// @route   GET /api/notifications
// @desc    Get expiring IDs
// @access  Public
router.get("/", async (req, res) => {
  try {
    const { days = 10 } = req.query;
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + parseInt(days));

    const expiringIds = await Individual.find({
      expiryDate: {
        $gte: today,
        $lte: futureDate
      }
    }).populate({
      path: 'company',
      select: 'name',
      populate: { path: 'mainPerson', select: 'name' }
    });

    // Add alert level
    const individualsWithAlerts = expiringIds.map(individual => {
      const daysUntilExpiry = Math.ceil((individual.expiryDate - today) / (1000 * 60 * 60 * 24));
      let alertLevel = null;
      
      if (daysUntilExpiry <= 5) {
        alertLevel = 'red';
      } else if (daysUntilExpiry <= 10) {
        alertLevel = 'orange';
      }

      return {
        ...individual.toObject(),
        alertLevel,
        daysUntilExpiry
      };
    });

    res.json(individualsWithAlerts);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

export default router; 