/**
 * BasePulse API Server
 * Backend API for Sideshift integration
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import { config } from './config/env';
import { errorHandler } from './middleware/error-handler';
import sideshiftRoutes from './routes/sideshift.routes';
import pollsRoutes from './routes/polls.routes';
import leaderboardRoutes from './routes/leaderboard.routes';
import preferencesRoutes from './routes/preferences.routes';
import analyticsRoutes from './routes/analytics.routes';
import announcementsRoutes from './routes/announcements.routes';
import gasRoutes from './routes/gas.routes';
import questsRoutes from './routes/quests.routes';
import badgesRoutes from './routes/badges.routes';
import levelsRoutes from './routes/levels.routes';
// Creator quest system routes
import membershipRoutes from './routes/membership.routes';
import seasonsRoutes from './routes/seasons.routes';
import pointsRoutes from './routes/points.routes';
import creatorQuestsRoutes from './routes/creator-quests.routes';
import aiRoutes from './routes/ai.routes';
import { logger } from './utils/logger';

// Create Express app
const app = express();

// Trust proxy - required when behind reverse proxies (Render, Cloudflare, etc.)
// This allows Express to trust X-Forwarded-* headers for correct IP detection
app.set('trust proxy', true);

// Middleware
app.use(cors({
  origin: config.cors.origin,
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: config.server.env,
  });
});

// API routes
app.use('/api/sideshift', sideshiftRoutes);
app.use('/api/polls', pollsRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/preferences', preferencesRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/announcements', announcementsRoutes);
app.use('/api/gas', gasRoutes);
app.use('/api/quests', questsRoutes);
app.use('/api/badges', badgesRoutes);
app.use('/api/levels', levelsRoutes);
// Creator quest system routes
app.use('/api/membership', membershipRoutes);
app.use('/api/seasons', seasonsRoutes);
app.use('/api/points', pointsRoutes);
app.use('/api/creator-quests', creatorQuestsRoutes);
app.use('/api/ai', aiRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler (must be last)
app.use(errorHandler);

// Start server
const PORT = config.server.port;

app.listen(PORT, () => {
  logger.info(`🚀 BasePulse API running on port ${PORT}`);
  logger.info(`Environment: ${config.server.env}`);
  logger.info(`Allowed CORS origins: ${Array.isArray(config.cors.origin) ? config.cors.origin.join(', ') : config.cors.origin}`);
  logger.info(`Sideshift API: ${config.sideshift.apiUrl}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

export default app;
