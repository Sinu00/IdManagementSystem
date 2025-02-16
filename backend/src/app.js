import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes.js';
import mainPersonRoutes from './routes/mainPerson.routes.js';
import companyRoutes from './routes/company.routes.js';
import individualRoutes from './routes/individual.routes.js';
import notificationRoutes from './routes/notification.routes.js';

const app = express();

// Middleware
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/main-persons', mainPersonRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/individuals', individualRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/auth', authRoutes);

export default app; 