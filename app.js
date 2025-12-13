import express from 'express';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import morgan from 'morgan';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import uploadRoutes from './routes/upload.js';
import logsRoutes from './routes/logs.js';
import restaurantRoutes from './routes/restaurants.js';
import { requestLogger } from './middlewares/logger.js';
import { authMiddleware } from './middlewares/auth.js';

dotenv.config();

const app = express();

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cors({ origin: true }));
app.use(morgan('dev'));
app.use(authMiddleware);
app.use(requestLogger);

app.use('/api/auth', authRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/restaurants', restaurantRoutes);
app.use('/api/logs', logsRoutes);

// health
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    process.exit(1);
  }
}

connectDB();

export default app;
