import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { errorHandler } from './middleware/errorMiddleware';
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import presenceRoutes from './routes/presenceRoutes';

dotenv.config();

const app = express();

// Configure CORS pour autoriser le domaine de ton frontend
const corsOptions = {
  origin: 'https://scan-front-vf.vercel.app', // Remplace par l'URL de ton frontend
  methods: 'GET,POST,PUT,DELETE',
  allowedHeaders: 'Content-Type, Authorization',
};

app.use(cors(corsOptions));

app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/presences', presenceRoutes);
app.use('/uploads', express.static('uploads'));

// Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
