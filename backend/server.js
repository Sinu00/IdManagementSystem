import express from "express";
import dotenv from "dotenv";
import { connectDB } from "./config/db.js";

dotenv.config();

const app = express();

app.listen(3000, () => {
  connectDB();
  console.log("Server is running on port http://localhost:3000");
});
