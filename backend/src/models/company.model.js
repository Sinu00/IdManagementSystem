import mongoose from "mongoose";

const companySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    mainPerson: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MainPerson",
      required: true
    },
    crNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    sponserId: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    gosiNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    makthabNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true
    }
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual for individuals in this company
companySchema.virtual('individuals', {
  ref: 'Individual',
  localField: '_id',
  foreignField: 'company'
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