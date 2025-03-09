import mongoose from "mongoose";

const notifyCompanyAdminSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true
    },
    crNumber: {
      type: String,
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
    requestType: {
      type: String,
      required: [true, 'Request type is required'],
      enum: ['ADD', 'PAYMENT'],
      default: 'ADD'
    },
    paymentType: {
      type: String,
      enum: ['qiwa', 'muqeem', 'efa', 'saudi', 'cr'],
      required: function() {
        return this.requestType === 'PAYMENT';
      }
    },
    amount: {
      type: Number,
      default: 0
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, 'User reference is required']
    },
    originalCompany: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: function() {
        return this.requestType === 'PAYMENT';
      }
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    }
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

const NotifyCompanyAdmin = mongoose.model("NotifyCompanyAdmin", notifyCompanyAdminSchema);

export default NotifyCompanyAdmin; 