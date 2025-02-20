import mongoose from "mongoose";

const companyIncomeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true
    },
    iqamaNumber: {
      type: String,
      required: [true, 'Iqama number is required'],
      trim: true
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0, 'Amount cannot be negative']
    },
    referredBy: {
      type: String,
      trim: true
    },
    addedBy: {
      type: String,
      trim: true
    },
    dateAndTime: {
      type: Date,
      required: [true, 'Date and time is required'],
      default: Date.now
    },
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: [true, 'Company is required']
    }
  },
  { timestamps: true }
);

const CompanyIncome = mongoose.model("CompanyIncome", companyIncomeSchema);

export default CompanyIncome; 