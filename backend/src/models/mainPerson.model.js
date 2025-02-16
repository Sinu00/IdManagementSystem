import mongoose from "mongoose";

const mainPersonSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    contactNumber: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const MainPerson = mongoose.model("MainPerson", mainPersonSchema);

export default MainPerson; 