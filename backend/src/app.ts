import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import matchesRouter from './routes/matches';
import communitiesRouter from './routes/communities';
import predictionsRouter from './routes/predictions';
import leaderboardRouter from './routes/leaderboard';
import authRouter from './routes/auth';
import adminRouter from './routes/admin';
import { errorHandler } from './middleware/errorHandler';

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/communities', communitiesRouter);
app.use('/api/predictions', predictionsRouter);
app.use('/api/leaderboard', leaderboardRouter);
app.use('/api/matches', matchesRouter);
app.use('/api/auth', authRouter);
app.use('/api/admin', adminRouter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Election Predictor API is running',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

export default app;
