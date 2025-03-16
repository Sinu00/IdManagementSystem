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

// Get all notifications (excluding Nasser's)
export const getAllNotifications = async (req, res) => {
  try {
    const notifications = await NotifyAdmin.find({
      mainPerson: { $ne: "67d09798726e5a47c4caf071" }  // Exclude Nasser's notifications
    })
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

// Get only Nasser's notifications
export const getAllNasserNotifications = async (req, res) => {
  try {
    const notifications = await NotifyAdmin.find({
      mainPerson: "67d09798726e5a47c4caf071"  // Only Nasser's notifications
    })
      .populate('company')
      .populate('mainPerson')
      .populate('addedBy', 'username')
      .sort({ createdAt: -1 });
    
    res.status(StatusCodes.OK).json(notifications);
  } catch (error) {
    console.error('Error fetching Nasser notifications:', error);
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
    const notification = await NotifyAdmin.findById(req.params.id)
      .populate('originalIndividual')
      .populate({
        path: 'company',
        populate: {
          path: 'mainPerson'
        }
      });
    
    if (!notification) {
      return res.status(StatusCodes.NOT_FOUND).json({ message: 'Notification not found' });
    }

    const Individual = mongoose.model('Individual');
    const Income = mongoose.model('Income');
    const Company = mongoose.model('Company');
    let updatedIndividual;

    // Helper function to get company with mainPerson
    const getCompanyWithMainPerson = async (companyId) => {
      const company = await Company.findById(companyId).populate('mainPerson');
      if (!company || !company.mainPerson) {
        throw new Error('Company or main person not found');
      }
      return company;
    };

    // Helper function to create income record
    const createIncomeRecord = async (data) => {
      const company = await getCompanyWithMainPerson(data.companyId);
      await Income.create({
        name: data.name,
        iqamaNumber: data.iqamaNumber,
        amount: data.amount,
        referredBy: data.referredBy || '',
        addedBy: data.addedBy,
        dateAndTime: new Date(),
        notes: data.notes,
        mainPerson: company.mainPerson._id
      });
    };

    switch (notification.requestType) {
      case 'ADD':
        // Handle new individual creation
        const { addedBy, __v, _id, createdAt, updatedAt, requestType, originalIndividual, ...individualData } = notification.toObject();
        
        // Get the initial payment amount
        const initialPayment = Number(notification.amount) || 0;
        const iqamaPrice = Number(notification.iqamaPrice) || 5000;
        
        // Calculate payment status
        const pendingAmount = iqamaPrice - initialPayment;
        const isFullyPaid = initialPayment === iqamaPrice;

        // Set up individual data with correct payment details
        individualData.iqamaPrice = iqamaPrice;
        individualData.totalPaidAmount = initialPayment;
        individualData.pendingAmount = pendingAmount;
        individualData.isFullyPaid = isFullyPaid;
        individualData.lastUpdateDate = new Date();
        individualData.lastUpdatedBy = req.user.username;
        individualData.referredBy = notification.referredBy;
        
        // Add payment history if there's an initial payment
        individualData.paymentHistory = initialPayment > 0 ? [{
          amount: initialPayment,
          paidBy: req.user.username,
          paidAt: new Date(),
          remainingAmount: pendingAmount
        }] : [];
        
        const newIndividual = new Individual(individualData);
        updatedIndividual = await newIndividual.save();

        // Create income record if there's an initial payment
        if (initialPayment > 0) {
          await createIncomeRecord({
            name: individualData.name,
            iqamaNumber: individualData.iqamaNumber,
            amount: initialPayment,
            referredBy: individualData.referredBy,
            addedBy: req.user.username,
            notes: 'Initial payment for new individual',
            companyId: notification.company
          });
        }
        break;

      case 'RENEW':
        if (!notification.originalIndividual) {
          throw new Error('Original individual not found for renewal');
        }
        
        const renewalPayment = Number(notification.amount) || 0;
        const renewalIqamaPrice = Number(notification.iqamaPrice) || 5000;
        const renewalPendingAmount = renewalIqamaPrice - renewalPayment;
        const renewalIsFullyPaid = renewalPayment === renewalIqamaPrice;

        // Update expiry date and payment status
        updatedIndividual = await Individual.findByIdAndUpdate(
          notification.originalIndividual._id,
          {
            expiryDate: notification.expiryDate,
            totalPaidAmount: renewalPayment,
            iqamaPrice: renewalIqamaPrice,
            pendingAmount: renewalPendingAmount,
            isFullyPaid: renewalIsFullyPaid,
            lastUpdateDate: new Date(),
            lastUpdatedBy: req.user.username,
            $set: {
              paymentHistory: renewalPayment > 0 ? [{
                amount: renewalPayment,
                paidBy: req.user.username,
                paidAt: new Date(),
                remainingAmount: renewalPendingAmount
              }] : []
            }
          },
          { new: true, runValidators: true }
        );

        // Create income record for renewal payment
        if (renewalPayment > 0) {
          await createIncomeRecord({
            name: updatedIndividual.name,
            iqamaNumber: updatedIndividual.iqamaNumber,
            amount: renewalPayment,
            referredBy: updatedIndividual.referredBy,
            addedBy: req.user.username,
            notes: 'Renewal payment',
            companyId: notification.company
          });
        }
        break;

      case 'PAYMENT':
        if (!notification.originalIndividual) {
          throw new Error('Original individual not found for payment');
        }
        // Update payment information
        const paymentAmount = Number(notification.amount) || 0;
        const newTotalPaid = notification.originalIndividual.totalPaidAmount + paymentAmount;
        const newPendingAmount = notification.originalIndividual.iqamaPrice - newTotalPaid;
        const paymentIsFullyPaid = newTotalPaid === notification.originalIndividual.iqamaPrice;
        
        updatedIndividual = await Individual.findByIdAndUpdate(
          notification.originalIndividual._id,
          {
            $push: {
              paymentHistory: {
                amount: paymentAmount,
                paidBy: req.user.username,
                paidAt: new Date(),
                remainingAmount: newPendingAmount
              }
            },
            totalPaidAmount: newTotalPaid,
            pendingAmount: newPendingAmount,
            isFullyPaid: paymentIsFullyPaid,
            lastUpdateDate: new Date(),
            lastUpdatedBy: req.user.username
          },
          { new: true, runValidators: true }
        );

        // Create income record for payment
        if (paymentAmount > 0) {
          await createIncomeRecord({
            name: updatedIndividual.name,
            iqamaNumber: updatedIndividual.iqamaNumber,
            amount: paymentAmount,
            referredBy: updatedIndividual.referredBy,
            addedBy: req.user.username,
            notes: 'Pending payment',
            companyId: notification.company
          });
        }
        break;

      default:
        throw new Error('Invalid request type');
    }
    
    // Delete the notification after processing
    await NotifyAdmin.findByIdAndDelete(req.params.id);
    
    res.status(StatusCodes.OK).json({ 
      message: `${notification.requestType} request approved successfully`,
      individual: updatedIndividual
    });
  } catch (error) {
    console.error('Error approving notification:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ 
      message: error.message || 'Failed to approve notification'
    });
  }
}; 