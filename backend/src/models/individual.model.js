import mongoose from "mongoose";

const individualSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true
    },
    nationality: {
      type: String,
      required: [true, 'Nationality is required'],
      trim: true
    },
    phoneNumber: {
      type: String,
      trim: true
    },
    iqamaNumber: {
      type: String,
      required: [true, 'Iqama number is required'],
      unique: true,
      trim: true
    },
    expiryDate: {
      type: Date,
      required: [true, 'Expiry date is required']
    },
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: [true, 'Company is required']
    },
    mainPerson: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MainPerson",
      required: false
    },
    referredBy: {
      type: String,
      trim: true
    },
    amount: {
      type: Number,
      default: 0
    },
    totalPaidAmount: {
      type: Number,
      default: 0
    },
    iqamaPrice: {
      type: Number,
      required: true,
      default: 5000
    },
    pendingAmount: {
      type: Number,
      default: function() {
        return this.iqamaPrice - this.totalPaidAmount;
      }
    },
    isFullyPaid: {
      type: Boolean,
      default: false
    },
    lastUpdatedBy: {
      type: String,
      trim: true
    },
    lastUpdateDate: {
      type: Date,
      default: Date.now
    },
    paymentHistory: [{
      amount: Number,
      paidBy: String,
      paidAt: {
        type: Date,
        default: Date.now
      }
    }]
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Add index for better query performance
individualSchema.index({ company: 1 });
individualSchema.index({ iqamaNumber: 1 }, { unique: true });

// Add virtual for status calculation
individualSchema.virtual('status').get(function() {
  const today = new Date();
  const expiry = new Date(this.expiryDate);
  const daysUntilExpiry = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));

  if (daysUntilExpiry < 0) return 'Expired';
  if (daysUntilExpiry <= 5) return 'Critical';
  if (daysUntilExpiry <= 10) return 'Warning';
  return 'Active';
});

// Update the payment status method
individualSchema.methods.updatePaymentStatus = function() {
  this.pendingAmount = this.iqamaPrice - this.totalPaidAmount;
  this.isFullyPaid = this.pendingAmount <= 0;
  return this.isFullyPaid;
};

const Individual = mongoose.model("Individual", individualSchema);

export default Individual; 