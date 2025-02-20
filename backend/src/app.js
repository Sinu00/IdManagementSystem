import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes.js';
import mainPersonRoutes from './routes/mainPerson.routes.js';
import companyRoutes from './routes/company.routes.js';
import individualRoutes from './routes/individual.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import companyExpenseRoutes from './routes/companyExpense.routes.js';
import companyIncomeRoutes from './routes/companyIncome.routes.js';

const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/main-persons', mainPersonRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/individuals', individualRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/expenses', companyExpenseRoutes);
app.use('/api/incomes', companyIncomeRoutes);

export default app; 