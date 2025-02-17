import mongoose from "mongoose";

const individualSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    iqamaNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    expiryDate: {
      type: Date,
      required: true
    },
    mainPerson: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MainPerson",
      required: false
    },
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
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
    nationality: {
      type: String,
      trim: true
    },
    phoneNumber: {
      type: String,
      trim: true
    }
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

// Add virtual for status
individualSchema.virtual('status').get(function() {
  const today = new Date();
  const daysUntilExpiry = this.daysUntilExpiry;
  
  if (daysUntilExpiry < 0) return 'expired';
  if (daysUntilExpiry <= 5) return 'red';
  if (daysUntilExpiry <= 10) return 'orange';
  return 'green';
});

const Individual = mongoose.model("Individual", individualSchema);

export default Individual; 