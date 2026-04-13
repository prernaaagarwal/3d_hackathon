import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createRouteHandler } from 'uploadthing/express';
import { env } from './config/env';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { authMiddleware } from './middleware/auth';
import { rateLimiter } from './middleware/rateLimiter';
import { uploadRouter } from './config/uploadthing';

// Route imports
import { propertyRoutes } from './routes/property.routes';
import { roiRoutes } from './routes/roi.routes';
import { marketRoutes } from './routes/market.routes';
import { tourRoutes } from './routes/tour.routes';
import { jobRoutes } from './routes/job.routes';
import { uploadRoutes } from './routes/upload.routes';
import { aiRoutes } from './routes/ai.routes';
import { developerRoutes } from './routes/developer.routes';
import { tourService } from './services/tour.service';
import { roiService } from './services/roi.service';
import { aiService } from './services/ai.service';
import { worldApiService } from './services/worldApi.service';

const app = express();

// Global middleware
app.use(helmet());
app.use(cors({ origin: env.FRONTEND_URL, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(rateLimiter({ windowMs: 60 * 1000, maxRequests: 100 }));

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// UploadThing route handler (public — frontend handles auth via UploadThing callbacks)
app.use(
  '/api/uploadthing',
  createRouteHandler({
    router: uploadRouter,
    config: { logLevel: 'Info' },
  }),
);

// Public routes (no auth required)
app.use('/api/market', marketRoutes);

// Public tour viewer
app.get('/api/tours/public/:id', async (req, res, next) => {
  try {
    const tour = await tourService.getPublicTour(req.params.id);
    res.json({ data: tour });
  } catch (error) {
    next(error);
  }
});

// Public world assets endpoint (fetches .spz URLs for the 3D viewer)
app.get('/api/tours/public/:id/assets', async (req, res, next) => {
  try {
    const tour = await tourService.getPublicTour(req.params.id);
    if (!tour.world_id) {
      res.status(404).json({ error: '3D world not available for this tour', code: 'NO_WORLD' });
      return;
    }
    const assets = await worldApiService.getWorldAssets(tour.world_id);
    res.json({ data: assets });
  } catch (error) {
    next(error);
  }
});

// Public ROI calculator (pure computation, no auth needed)
app.post('/api/roi/calculate', express.json(), async (req, res, next) => {
  try {
    const result = roiService.calculate(req.body);
    res.json({ data: result });
  } catch (error) {
    next(error);
  }
});

// Public AI ROI narrative (accessible from public ROI Wizard)
app.post('/api/ai/roi-narrative', express.json(), async (req, res, next) => {
  try {
    const { area, purchasePrice, annualRent } = req.body;
    if (!area || !purchasePrice || !annualRent) {
      res.status(400).json({ error: 'Missing required fields: area, purchasePrice, annualRent', code: 'VALIDATION_ERROR' });
      return;
    }
    const narrative = await aiService.generateRoiNarrative(req.body);
    res.json({ data: { narrative } });
  } catch (error) {
    next(error);
  }
});

// Authenticated routes
app.use('/api/properties', authMiddleware as express.RequestHandler, propertyRoutes);
app.use('/api/roi', authMiddleware as express.RequestHandler, roiRoutes);
app.use('/api/tours', authMiddleware as express.RequestHandler, tourRoutes);
app.use('/api/jobs', authMiddleware as express.RequestHandler, jobRoutes);
app.use('/api/uploads', authMiddleware as express.RequestHandler, uploadRoutes);
app.use('/api/ai', authMiddleware as express.RequestHandler, aiRoutes);
app.use('/api/developers', authMiddleware as express.RequestHandler, developerRoutes);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found', code: 'NOT_FOUND' });
});

// Error handling (must be last)
app.use(errorHandler as express.ErrorRequestHandler);

// Start server
const PORT = parseInt(env.PORT, 10);
app.listen(PORT, () => {
  logger.info(`PropIntel API server running on port ${PORT}`);
});

export default app;

