import mongoose from "mongoose";

const companySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    mainPerson: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MainPerson",
      required: true,
    },
    companyCode: String,
    address: String,
  },
  { timestamps: true }
);

const Company = mongoose.model("Company", companySchema);

export default Company; 