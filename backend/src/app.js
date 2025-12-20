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
import notifyAdminRoutes from './routes/notifyAdmin.routes.js';
import notifyCompanyAdminRoutes from './routes/notifyCompanyAdmin.routes.js';
import nasserRoutes from './routes/nasser.routes.js';

const app = express();

// Middleware
app.use(cors({
  origin: ['https://namoraidmanagementsystem.vercel.app', 'http://localhost:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'Access-Control-Allow-Headers',
    'Access-Control-Allow-Origin',
    'Access-Control-Allow-Credentials'
  ],
  exposedHeaders: ['Authorization'],
  maxAge: 86400 // 24 hours
}));
app.use(express.json());

// Debug middleware to log all requests
app.use((req, res, next) => {
  if (req.path.includes('companies') && req.path.includes('main-person')) {
    console.log('🌐 APP LEVEL - Request to companies/main-person:', req.method, req.path, req.params);
  }
  next();
});

// Routes with /api prefix
app.use('/api/auth', authRoutes);
app.use('/api/main-persons', mainPersonRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/individuals', individualRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/income', incomeRoutes);
app.use('/api/expense', expenseRoutes);
app.use('/api/iqama-price', iqamaPriceRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notify-admin', notifyAdminRoutes);
app.use('/api/notify-company-admin', notifyCompanyAdminRoutes);
app.use('/api/nasser', nasserRoutes);

export default app; 