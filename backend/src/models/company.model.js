import mongoose from "mongoose";

const companySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true
    },
    address: {
      type: String,
      required: [true, 'Address is required'],
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
    makthabNumber: {
      type: String,
      trim: true
    },
    contactPerson: {
      type: String,
      trim: true
    },
    contactNumber: {
      type: String,
      trim: true
    },
    mainPerson: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MainPerson',
      required: true
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

// Virtual for card counts
companySchema.virtual('cardCounts').get(async function() {
  const individuals = await mongoose.model('Individual').find({ company: this._id });
  
  const counts = {
    redCards: 0,
    orangeCards: 0,
    greenCards: 0,
    totalIndividuals: individuals.length
  };

  individuals.forEach(individual => {
    const daysUntilExpiry = Math.ceil((individual.expiryDate - new Date()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry <= 5) {
      counts.redCards++;
    } else if (daysUntilExpiry <= 10) {
      counts.orangeCards++;
    } else {
      counts.greenCards++;
    }
  });

  return counts;
});

const Company = mongoose.model("Company", companySchema);

export default Company; 