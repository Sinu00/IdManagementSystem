import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import app from './app.js';
import userRoutes from './routes/user.routes.js';

dotenv.config();

const PORT = process.env.PORT || 3000;

connectDB().then(() => {
  app.use('/api/users', userRoutes);
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}); 