import { Router, Request, Response, NextFunction } from 'express';
import { marketService } from '../services/market.service';

const router = Router();

// GET /api/market/areas — List all areas
router.get('/areas', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const areas = await marketService.getAreas();
    res.json({ data: areas });
  } catch (error) {
    next(error);
  }
});

// GET /api/market/stats — Get area statistics
router.get('/stats', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const area = req.query.area as string | undefined;
    const stats = await marketService.getAreaStats(area);
    res.json({ data: stats });
  } catch (error) {
    next(error);
  }
});

// GET /api/market/properties — Browse market properties (public)
router.get('/properties', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await marketService.getProperties({
      area: req.query.area as string | undefined,
      propertyType: req.query.property_type as string | undefined,
      minPrice: req.query.min_price ? Number(req.query.min_price) : undefined,
      maxPrice: req.query.max_price ? Number(req.query.max_price) : undefined,
      minBedrooms: req.query.min_bedrooms ? Number(req.query.min_bedrooms) : undefined,
      page: req.query.page ? Number(req.query.page) : undefined,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
});

export { router as marketRoutes };

