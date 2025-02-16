import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { connectDB } from "./config/db.js";

// Route imports
import authRoutes from "./routes/auth.routes.js";
import mainPersonRoutes from "./routes/mainPerson.routes.js";
import companyRoutes from "./routes/company.routes.js";
import individualRoutes from "./routes/individual.routes.js";
import notificationRoutes from "./routes/notification.routes.js";

dotenv.config();

const app = express();

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? 'your-production-domain.com' 
    : ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true
}));

app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/main-persons", mainPersonRoutes);
app.use("/api/companies", companyRoutes);
app.use("/api/individuals", individualRoutes);
app.use("/api/notifications", notificationRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    message: err.message,
    stack: process.env.NODE_ENV === "production" ? null : err.stack,
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  connectDB();
  console.log(`Server is running on port http://localhost:${PORT}`);
});
