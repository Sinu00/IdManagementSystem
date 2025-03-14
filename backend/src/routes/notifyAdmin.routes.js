import express from 'express';
import { 
  createNotification, 
  getAllNotifications,
  getNotificationById,
  updateNotification,
  deleteNotification,
  approveNotification
} from '../controllers/notifyAdmin.controller.js';
import { protect, adminProtect } from '../middleware/auth.middleware.js';
import mongoose from 'mongoose';

const router = express.Router();

// Routes that require authentication but not admin privileges
router.post('/', protect, createNotification);           // Any authenticated user can create a notification

// Routes that require admin privileges
router.get('/', protect, adminProtect, getAllNotifications);    // Only admins can view all notifications
router.get('/:id', protect, adminProtect, getNotificationById); // Only admins can view a specific notification
router.put('/:id', protect, adminProtect, updateNotification);  // Only admins can update notifications
router.delete('/:id', protect, adminProtect, deleteNotification); // Only admins can delete notifications
router.post('/:id/approve', protect, adminProtect, approveNotification); // Only admins can approve notifications

// Add reject notification endpoint
router.post('/:id/reject', protect, adminProtect, async (req, res) => {
  try {
    const notification = await mongoose.model('NotifyAdmin').findById(req.params.id);
    
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    // Delete the notification (rejection means removing it from the system)
    await mongoose.model('NotifyAdmin').findByIdAndDelete(notification._id);

    res.json({ message: 'Notification rejected and deleted successfully' });
  } catch (error) {
    console.error('Error rejecting notification:', error);
    res.status(400).json({ message: error.message || 'Failed to reject notification' });
  }
});

export default router; 