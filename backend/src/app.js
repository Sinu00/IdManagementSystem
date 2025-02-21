import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes.js';
import mainPersonRoutes from './routes/mainPerson.routes.js';
import companyRoutes from './routes/company.routes.js';
import individualRoutes from './routes/individual.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import incomeRoutes from './routes/income.routes.js';
import expenseRoutes from './routes/expense.routes.js';
import iqamaPriceRoutes from './routes/iqamaPrice.routes.js';
import userRoutes from './routes/user.routes.js';

const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || ['http://localhost:5173', 'https://your-domain.vercel.app'],
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/main-persons', mainPersonRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/individuals', individualRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/income', incomeRoutes);
app.use('/api/expense', expenseRoutes);
app.use('/api/iqama-price', iqamaPriceRoutes);
app.use('/api/users', userRoutes);

export default app; 