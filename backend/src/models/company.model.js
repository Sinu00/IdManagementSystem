import mongoose from "mongoose";

const companySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true
    },
    crNumber: {
      type: String,
      unique: true,
      sparse: true,
      trim: true
    },
    sponserId: {
      type: String,
      trim: true
    },
    gosiNumber: {
      type: String,
      trim: true
    },
    molNumber: {
      type: String,
      trim: true
    },
    mainPerson: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MainPerson',
      required: true
    },
    crAmount: {
      type: Number,
      default: 0
    },
    qiwaAmount: {
      type: Number,
      default: 0
    },
    muqeemAmount: {
      type: Number,
      default: 0
    },
    efaAmount: {
      type: Number,
      default: 0
    },
    saudiAmount: {
      type: Number,
      default: 0
    },
    saudiCount: {
      type: Number,
      default: 0
    },
    paymentStatus: {
      type: String,
      enum: ['none_paid', 'partially_paid', 'fully_paid', 'renewed'],
      default: 'none_paid'
    }
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual for individuals
companySchema.virtual('individuals', {
  ref: 'Individual',
  localField: '_id',
  foreignField: 'company'
});

// Pre-save middleware to ensure unique CR number within mainPerson
companySchema.pre('save', async function(next) {
  if (this.crNumber) {
    const existingCompany = await this.constructor.findOne({
      crNumber: this.crNumber,
      mainPerson: this.mainPerson,
      _id: { $ne: this._id }
    });
    
    if (existingCompany) {
      throw new Error('CR number already exists for this main person');
    }
  }
  next();
});

// Add middleware to update payment status before save
companySchema.pre('save', function(next) {
  const hasQiwa = this.qiwaAmount > 0;
  const hasMuqeem = this.muqeemAmount > 0;
  const hasEfa = this.efaAmount > 0;

  // Only update payment status if it's not being explicitly set
  if (!this.isModified('paymentStatus')) {
    // Check if all required payments are made
    if (hasQiwa && hasMuqeem && hasEfa) {
      this.paymentStatus = 'fully_paid';
    } else if (hasQiwa || hasMuqeem || hasEfa) {
      this.paymentStatus = 'partially_paid';
    } else {
      this.paymentStatus = 'none_paid';
    }
  }

  next();
});

// Virtual for card counts
companySchema.virtual('cardCounts').get(async function() {
  const today = new Date();
  const thirtyDaysFromNow = new Date(today.getTime() + (30 * 24 * 60 * 60 * 1000));
  
  const individuals = await mongoose.model('Individual').aggregate([
    { $match: { company: this._id } },
    {
      $group: {
        _id: null,
        redCards: {
          $sum: { $cond: [{ $lt: ["$expiryDate", today] }, 1, 0] }
        },
        orangeCards: {
          $sum: {
            $cond: [
              { 
                $and: [
                  { $gte: ["$expiryDate", today] },
                  { $lte: ["$expiryDate", thirtyDaysFromNow] }
                ]
              },
              1,
              0
            ]
          }
        },
        greenCards: {
          $sum: { $cond: [{ $gt: ["$expiryDate", thirtyDaysFromNow] }, 1, 0] }
        },
        totalIndividuals: { $sum: 1 }
      }
    }
  ]);

  return individuals[0] || {
    redCards: 0,
    orangeCards: 0,
    greenCards: 0,
    totalIndividuals: 0
  };
});

// Add virtual field for total amount
companySchema.virtual('totalAmount').get(function() {
  return this.crAmount + this.qiwaAmount + this.muqeemAmount + this.efaAmount;
});

const Company = mongoose.model("Company", companySchema);

export default Company; 