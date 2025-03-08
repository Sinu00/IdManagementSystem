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

const router = express.Router();

// Routes that require authentication but not admin privileges
router.post('/', protect, createNotification);           // Any authenticated user can create a notification

// Routes that require admin privileges
router.get('/', protect, adminProtect, getAllNotifications);    // Only admins can view all notifications
router.get('/:id', protect, adminProtect, getNotificationById); // Only admins can view a specific notification
router.put('/:id', protect, adminProtect, updateNotification);  // Only admins can update notifications
router.delete('/:id', protect, adminProtect, deleteNotification); // Only admins can delete notifications
router.post('/:id/approve', protect, adminProtect, approveNotification); // Only admins can approve notifications

export default router; 