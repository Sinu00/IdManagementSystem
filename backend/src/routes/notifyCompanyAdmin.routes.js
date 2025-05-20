import express from 'express';
import { protect, adminProtect } from '../middleware/auth.middleware.js';
import NotifyCompanyAdmin from '../models/notifyCompanyAdmin.model.js';
import Company from '../models/company.model.js';
import Expense from '../models/expense.model.js';
import mongoose from 'mongoose';

const router = express.Router();

// Routes that require authentication but not admin privileges
router.post('/', protect, async (req, res) => {
  try {
    const notification = new NotifyCompanyAdmin({
      ...req.body,
      addedBy: req.user._id
    });
    
    const savedNotification = await notification.save();
    const populatedNotification = await NotifyCompanyAdmin.findById(savedNotification._id)
      .populate('mainPerson', 'name email contactNumber')
      .populate('addedBy', 'username')
      .populate('originalCompany', 'name');
    
    res.status(201).json(populatedNotification);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get all notifications (excluding Nasser's)
router.get('/', protect, adminProtect, async (req, res) => {
  try {
    const notifications = await NotifyCompanyAdmin.find({
      mainPerson: { $ne: "67d09798726e5a47c4caf071" }  // Exclude Nasser's notifications
    })
      .populate('mainPerson', 'name email contactNumber')
      .populate('addedBy', 'username')
      .populate('originalCompany', 'name crNumber sponserId gosiNumber molNumber')
      .sort({ createdAt: -1 });
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get Nasser's notifications
router.get('/nasser', protect, adminProtect, async (req, res) => {
  try {
    const notifications = await NotifyCompanyAdmin.find({
      mainPerson: "67d09798726e5a47c4caf071"  // Only Nasser's notifications
    })
      .populate('mainPerson', 'name email contactNumber')
      .populate('addedBy', 'username')
      .populate('originalCompany', 'name crNumber sponserId gosiNumber molNumber')
      .sort({ createdAt: -1 });
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get notification by ID
router.get('/:id', protect, adminProtect, async (req, res) => {
  try {
    const notification = await NotifyCompanyAdmin.findById(req.params.id)
      .populate('mainPerson', 'name email contactNumber')
      .populate('addedBy', 'username')
      .populate('originalCompany', 'name crNumber sponserId gosiNumber molNumber');
    
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    
    res.json(notification);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update notification
router.put('/:id', protect, adminProtect, async (req, res) => {
  try {
    const notification = await NotifyCompanyAdmin.findById(req.params.id);
    
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    
    Object.assign(notification, req.body);
    const updatedNotification = await notification.save();
    
    res.json(updatedNotification);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete notification
router.delete('/:id', protect, adminProtect, async (req, res) => {
  try {
    const notification = await NotifyCompanyAdmin.findById(req.params.id);
    
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    
    await NotifyCompanyAdmin.findByIdAndDelete(req.params.id);
    res.json({ message: 'Notification deleted successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Approve notification
router.post('/:id/approve', protect, adminProtect, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const notification = await NotifyCompanyAdmin.findById(req.params.id)
      .populate('mainPerson')
      .populate('originalCompany');

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    if (notification.status !== 'pending') {
      return res.status(400).json({ message: 'Notification already processed' });
    }

    // Handle different request types
    if (notification.requestType === 'ADD') {
      // Create new company
      const company = new Company({
        name: notification.name,
        crNumber: notification.crNumber,
        sponserId: notification.sponserId,
        gosiNumber: notification.gosiNumber,
        molNumber: notification.molNumber,
        mainPerson: notification.mainPerson._id,
        paymentStatus: 'none_paid',
        crAmount: notification.amount || 0 // Initial CR amount
      });
      await company.save({ session });

      // Create expense entry if amount is provided
      if (notification.amount > 0) {
        const expense = new Expense({
          name: `CR Amount for ${company.name}`,
          amount: notification.amount,
          company: company._id,
          mainPerson: company.mainPerson,
          expenseType: 'cr',
          transactionDate: new Date()
        });
        await expense.save({ session });
      }
    } else if (notification.requestType === 'PAYMENT') {
      if (!notification.originalCompany) {
        throw new Error('Original company not found for payment');
      }
      
      const company = notification.originalCompany;
      
      // Handle renewal case (CR payment when company is fully paid)
      if (notification.paymentType === 'cr' && company.paymentStatus === 'fully_paid') {
        // This is a renewal - set CR amount and reset others
        company.crAmount = notification.amount;
        company.qiwaAmount = 0;
        company.muqeemAmount = 0;
        company.efaAmount = 0;
        company.paymentStatus = 'none_paid'; // Reset to none_paid to start new payment cycle
      } else {
        // Regular payment update
        switch (notification.paymentType) {
          case 'qiwa':
            company.qiwaAmount = notification.amount;
            break;
          case 'muqeem':
            company.muqeemAmount = notification.amount;
            break;
          case 'efa':
            company.efaAmount = notification.amount;
            break;
          case 'saudi':
            company.saudiAmount = (company.saudiAmount || 0) + notification.amount;
            company.saudiCount = (company.saudiCount || 0) + 1;
            break;
          case 'cr':
            company.crAmount = notification.amount;
            break;
        }
      }

      await company.save({ session });

      // Create expense entry
      const expense = new Expense({
        name: notification.paymentType === 'cr' && company.paymentStatus === 'none_paid' 
          ? `CR Renewal Payment for ${company.name}`
          : `${notification.paymentType.toUpperCase()} Payment for ${company.name}`,
        amount: notification.amount,
        company: company._id,
        mainPerson: company.mainPerson,
        expenseType: notification.paymentType,
        specification: notification.paymentType === 'cr' && company.paymentStatus === 'none_paid'
          ? 'Renewal CR Payment'
          : `Regular ${notification.paymentType.toUpperCase()} Payment`,
        transactionDate: new Date()
      });
      await expense.save({ session });
    }

    // Delete the notification after successful processing
    await NotifyCompanyAdmin.findByIdAndDelete(notification._id, { session });

    await session.commitTransaction();
    res.json({ message: 'Notification processed successfully' });
  } catch (error) {
    await session.abortTransaction();
    res.status(400).json({ message: error.message });
  } finally {
    session.endSession();
  }
});

// Reject notification
router.post('/:id/reject', protect, adminProtect, async (req, res) => {
  try {
    const notification = await NotifyCompanyAdmin.findById(req.params.id);
    
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    if (notification.status !== 'pending') {
      return res.status(400).json({ message: 'Notification already processed' });
    }

    // Delete the notification
    await NotifyCompanyAdmin.findByIdAndDelete(notification._id);

    res.json({ message: 'Notification rejected and deleted successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

export default router; 