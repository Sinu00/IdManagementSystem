import mongoose from "mongoose";

const mainPersonSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    contactInfo: {
      phone: String,
      email: String,
    },
    description: String,
  },
  { timestamps: true }
);

const MainPerson = mongoose.model("MainPerson", mainPersonSchema);

export default MainPerson; 