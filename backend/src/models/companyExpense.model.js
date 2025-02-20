import mongoose from "mongoose";

const companyExpenseSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Expense name is required'],
      trim: true
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0, 'Amount cannot be negative']
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

const CompanyExpense = mongoose.model("CompanyExpense", companyExpenseSchema);

export default CompanyExpense; 