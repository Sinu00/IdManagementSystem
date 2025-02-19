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
    notes: {
      type: String,
      trim: true
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
    reference: {
      type: String,
      trim: true
    },
    document: {
      type: String,
      trim: true
    },
    referredBy: {
      type: String,
      trim: true
    },
    amount: {
      type: Number,
      default: 0
    },
    lastRenewedBy: {
      type: String,
      trim: true
    },
    lastRenewalDate: {
      type: Date,
      default: null
    }
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

const Individual = mongoose.model("Individual", individualSchema);

export default Individual; 