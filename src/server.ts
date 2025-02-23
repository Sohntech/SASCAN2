import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { errorHandler } from './middleware/errorMiddleware';
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import presenceRoutes from './routes/presenceRoutes';
import cron from 'node-cron';
import { markAbsentAtEightFifty } from './controllers/presenceController';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/presences', presenceRoutes);
app.use('/uploads', express.static('uploads'));

// Tâche cron pour marquer les absents à 16h
cron.schedule('56 20 * * *', async () => {
  console.log('Exécution de la tâche de marquage des absents à 20h40...');
  await markAbsentAtEightFifty();
});

// Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
