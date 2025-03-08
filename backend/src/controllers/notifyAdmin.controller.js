import NotifyAdmin from '../models/notifyAdmin.model.js';
import { StatusCodes } from 'http-status-codes';
import mongoose from 'mongoose';

// Create a new notification for admin
export const createNotification = async (req, res) => {
  try {
    const newNotification = new NotifyAdmin({
      ...req.body,
      addedBy: req.user._id
    });
    
    const savedNotification = await newNotification.save();
    res.status(StatusCodes.CREATED).json(savedNotification);
  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(StatusCodes.BAD_REQUEST).json({ 
      message: error.message || 'Failed to create notification'
    });
  }
};

// Get all notifications
export const getAllNotifications = async (req, res) => {
  try {
    const notifications = await NotifyAdmin.find()
      .populate('company')
      .populate('mainPerson')
      .populate('addedBy', 'username')
      .sort({ createdAt: -1 });
    
    res.status(StatusCodes.OK).json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ 
      message: error.message || 'Failed to fetch notifications'
    });
  }
};

// Get notification by ID
export const getNotificationById = async (req, res) => {
  try {
    const notification = await NotifyAdmin.findById(req.params.id)
      .populate('company')
      .populate('mainPerson')
      .populate('addedBy', 'username');
    
    if (!notification) {
      return res.status(StatusCodes.NOT_FOUND).json({ message: 'Notification not found' });
    }
    
    res.status(StatusCodes.OK).json(notification);
  } catch (error) {
    console.error('Error fetching notification:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ 
      message: error.message || 'Failed to fetch notification'
    });
  }
};

// Update notification
export const updateNotification = async (req, res) => {
  try {
    const updatedNotification = await NotifyAdmin.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!updatedNotification) {
      return res.status(StatusCodes.NOT_FOUND).json({ message: 'Notification not found' });
    }
    
    res.status(StatusCodes.OK).json(updatedNotification);
  } catch (error) {
    console.error('Error updating notification:', error);
    res.status(StatusCodes.BAD_REQUEST).json({ 
      message: error.message || 'Failed to update notification'
    });
  }
};

// Delete notification
export const deleteNotification = async (req, res) => {
  try {
    const deletedNotification = await NotifyAdmin.findByIdAndDelete(req.params.id);
    
    if (!deletedNotification) {
      return res.status(StatusCodes.NOT_FOUND).json({ message: 'Notification not found' });
    }
    
    res.status(StatusCodes.OK).json({ message: 'Notification deleted successfully' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ 
      message: error.message || 'Failed to delete notification'
    });
  }
};

// Approve notification (move to Individual model)
export const approveNotification = async (req, res) => {
  try {
    const notification = await NotifyAdmin.findById(req.params.id);
    
    if (!notification) {
      return res.status(StatusCodes.NOT_FOUND).json({ message: 'Notification not found' });
    }
    
    // Create a new individual record from the notification data
    const { addedBy, __v, _id, createdAt, updatedAt, ...individualData } = notification.toObject();
    
    // Use the Individual model directly from import to avoid circular dependency
    const Individual = mongoose.model('Individual');
    const newIndividual = new Individual(individualData);
    await newIndividual.save();
    
    // Delete the notification after approving
    await NotifyAdmin.findByIdAndDelete(req.params.id);
    
    res.status(StatusCodes.OK).json({ 
      message: 'Notification approved and moved to Individuals',
      individual: newIndividual
    });
  } catch (error) {
    console.error('Error approving notification:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ 
      message: error.message || 'Failed to approve notification'
    });
  }
}; 