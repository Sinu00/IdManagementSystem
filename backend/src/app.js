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
  origin: process.env.FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Add these lines before your routes
app.use((req, res, next) => {
  const allowedOrigins = [
    'https://namoraidmanagementsystem.vercel.app',
    'http://localhost:5173'
  ];
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization'
  );
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