import mongoose from "mongoose";

const iqamaPriceSchema = new mongoose.Schema({
  price: {
    type: Number,
    required: [true, 'Price is required'],
    default: 5000
  },
  effectiveDate: {
    type: Date,
    default: Date.now
  },
  updatedBy: {
    type: String,
    required: true
  }
}, { timestamps: true });

const IqamaPrice = mongoose.model("IqamaPrice", iqamaPriceSchema);

export default IqamaPrice; 