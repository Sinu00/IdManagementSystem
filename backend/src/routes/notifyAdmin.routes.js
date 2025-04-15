import express from 'express';
import { 
  createNotification, 
  getAllNotifications,
  getAllNasserNotifications,
  getNotificationById,
  updateNotification,
  deleteNotification,
  approveNotification
} from '../controllers/notifyAdmin.controller.js';
import { protect, adminProtect } from '../middleware/auth.middleware.js';
import mongoose from 'mongoose';
import NotifyAdmin from '../models/notifyAdmin.model.js';

const router = express.Router();

// Routes that require authentication but not admin privileges
router.post('/', protect, createNotification);           // Any authenticated user can create a notification

// Routes that require admin privileges
router.get('/', protect, adminProtect, async (req, res) => {
  try {
    const notifications = await NotifyAdmin.find({
      mainPerson: { $ne: "67d09798726e5a47c4caf071" }  // Exclude Nasser's notifications
    })
      .populate('company')
      .populate('mainPerson')
      .populate('addedBy', 'username')
      .sort({ createdAt: -1 });
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/nasser', protect, adminProtect, async (req, res) => {
  try {
    const notifications = await NotifyAdmin.find({
      mainPerson: "67d09798726e5a47c4caf071"  // Only Nasser's notifications
    })
      .populate('company')
      .populate('mainPerson')
      .populate('addedBy', 'username')
      .sort({ createdAt: -1 });
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/:id', protect, adminProtect, getNotificationById); // Only admins can view a specific notification
router.put('/:id', protect, adminProtect, updateNotification);  // Only admins can update notifications
router.delete('/:id', protect, adminProtect, deleteNotification); // Only admins can delete notifications
router.post('/:id/approve', protect, adminProtect, approveNotification); // Only admins can approve notifications

// Add reject notification endpoint
router.post('/:id/reject', protect, adminProtect, async (req, res) => {
  try {
    const notification = await NotifyAdmin.findById(req.params.id);
    
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    // Delete the notification (rejection means removing it from the system)
    await NotifyAdmin.findByIdAndDelete(notification._id);

    res.json({ message: 'Notification rejected and deleted successfully' });
  } catch (error) {
    console.error('Error rejecting notification:', error);
    res.status(400).json({ message: error.message || 'Failed to reject notification' });
  }
});

export default router; 