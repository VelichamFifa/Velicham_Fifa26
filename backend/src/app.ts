import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from './config';
import { errorHandler } from './middleware/errorHandler';
import { logger } from './lib/logger';

// Routes
import authRoutes from './routes/authRoutes';
import matchRoutes from './routes/matchRoutes';
import predictionRoutes from './routes/predictionRoutes';
import leaderboardRoutes from './routes/leaderboardRoutes';
import communityRoutes from './routes/communityRoutes';
import adminRoutes from './routes/adminRoutes';

const app: Express = express();

/** Production Static Web App (browser origin) — always allow alongside `FRONTEND_URL`. */
const AZURE_STATIC_WEB_APP_ORIGIN = 'https://blue-meadow-054418e0f.7.azurestaticapps.net';

// Middleware
app.use(helmet());
app.use();
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Log successful API responses in one place.
app.use((req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    if (req.path.startsWith('/api/') && res.statusCode < 400) {
      logger.info('apiSuccess', 'API request completed successfully', {
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        durationMs: Date.now() - start,
        ip: req.ip,
      });
    }
  });

  next();
});

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/predictions', predictionRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/communities', communityRoutes);
app.use('/api/admin', adminRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use(errorHandler);

// Initialize server
const initializeApp = async () => {
  try {
    // Start server
    app.listen(config.server.port, () => {
      console.log(`✓ Server running on port ${config.server.port}`);
      console.log(`✓ Environment: ${config.server.nodeEnv}`);
    });
  } catch (error) {
    logger.error('initializeApp', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

export default app;
export { initializeApp };
