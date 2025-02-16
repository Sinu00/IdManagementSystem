import mongoose from "mongoose";

const individualSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    idNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    position: {
      type: String,
      required: true,
      trim: true,
    },
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      validate: {
        validator: async function(companyId) {
          const company = await mongoose.model('Company').findById(companyId);
          return company !== null;
        },
        message: 'Company does not exist'
      }
    },
    issueDate: {
      type: Date,
      required: true,
      validate: {
        validator: function(date) {
          return date <= this.expiryDate;
        },
        message: 'Issue date must be before expiry date'
      }
    },
    expiryDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "expired", "revoked"],
      default: "active",
    },
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Add virtual for days until expiry
individualSchema.virtual('daysUntilExpiry').get(function() {
  return Math.ceil((this.expiryDate - new Date()) / (1000 * 60 * 60 * 24));
});

// Add pre-save middleware to update status based on expiry date
individualSchema.pre('save', function(next) {
  if (this.expiryDate < new Date()) {
    this.status = 'expired';
  }
  next();
});

const Individual = mongoose.model("Individual", individualSchema);

export default Individual; 