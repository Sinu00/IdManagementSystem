import mongoose from "mongoose";

const incomeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true
    },
    description: {
      type: String,
      trim: true,
      default: ''
    },
    iqamaNumber: {
      type: String,
      required: function() {
        // Only required if it's not a custom income
        return !this.isCustomIncome;
      },
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
    mainPerson: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MainPerson',  // Changed from 'Individual' to 'MainPerson'
      required: [true, 'Main person reference is required']
    },
    isCustomIncome: {
      type: Boolean,
      default: false
    },
    transactionDate: {
      type: Date,
      default: Date.now,
      required: true
    }
  },
  { timestamps: true }
);

const Income = mongoose.model("Income", incomeSchema);

export default Income;