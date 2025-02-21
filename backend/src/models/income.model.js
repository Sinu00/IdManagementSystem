import mongoose from "mongoose";

const incomeSchema = new mongoose.Schema(
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
    mainPerson: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MainPerson',  // Changed from 'Individual' to 'MainPerson'
      required: [true, 'Main person reference is required']
    }
  },
  { timestamps: true }
);

const Income = mongoose.model("Income", incomeSchema);

export default Income;