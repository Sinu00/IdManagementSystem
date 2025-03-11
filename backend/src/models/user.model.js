import mongoose from "mongoose";
import bcryptjs from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
    allowedMainPersons: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "MainPerson"
    }],
    hasIncomeAccess: {
      type: [String],
      validate: {
        validator: function(v) {
          return v.every(item => ['none', 'nasser', 'company'].includes(item));
        },
        message: props => `${props.value} contains invalid access types!`
      },
      default: ['none']
    }
  },
  { timestamps: true }
);

// Method to check password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcryptjs.compare(enteredPassword, this.password);
};

const User = mongoose.model("User", userSchema);

export default User;