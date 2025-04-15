import NotifyCompanyAdmin from '../models/notifyCompanyAdmin.model.js';
import { StatusCodes } from 'http-status-codes';
import mongoose from 'mongoose';

// Create a new company notification for admin
export const createNotification = async (req, res) => {
  try {
    const newNotification = new NotifyCompanyAdmin({
      ...req.body,
      addedBy: req.user._id
    });
    
    const savedNotification = await newNotification.save();
    res.status(StatusCodes.CREATED).json(savedNotification);
  } catch (error) {
    console.error('Error creating company notification:', error);
    res.status(StatusCodes.BAD_REQUEST).json({ 
      message: error.message || 'Failed to create company notification'
    });
  }
};

// Get all company notifications (excluding Nasser's)
export const getAllNotifications = async (req, res) => {
  try {
    const notifications = await NotifyCompanyAdmin.find({
      mainPerson: { $ne: "67d09798726e5a47c4caf071" }  // Exclude Nasser's notifications
    })
      .populate('mainPerson')
      .populate('addedBy', 'username')
      .sort({ createdAt: -1 });
    
    res.status(StatusCodes.OK).json(notifications);
  } catch (error) {
    console.error('Error fetching company notifications:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ 
      message: error.message || 'Failed to fetch notifications'
    });
  }
};

// Get all Nasser company notifications
export const getAllNasserNotifications = async (req, res) => {
  try {
    const notifications = await NotifyCompanyAdmin.find({
      mainPerson: "67d09798726e5a47c4caf071"  // Only Nasser's notifications
    })
      .populate('mainPerson')
      .populate('addedBy', 'username')
      .sort({ createdAt: -1 });
    
    res.status(StatusCodes.OK).json(notifications);
  } catch (error) {
    console.error('Error fetching Nasser company notifications:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ 
      message: error.message || 'Failed to fetch notifications'
    });
  }
};

// ... rest of the existing code ... 