import mongoose from "mongoose";

const individualSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    phoneNumber: String,
    idNumber: {
      type: String,
      required: true,
      unique: true,
    },
    expiryDate: {
      type: Date,
      required: true,
    },
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    notes: String,
  },
  { timestamps: true }
);

const Individual = mongoose.model("Individual", individualSchema);

export default Individual; 