import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate';
import { roiService } from '../services/roi.service';
import '../types/api.types';

const router = Router();

const roiCalculateSchema = z.object({
  purchase_price: z.number().positive(),
  annual_rent: z.number().positive(),
  service_charge: z.number().min(0).optional(),
  has_mortgage: z.boolean().optional(),
  down_payment_pct: z.number().min(0).max(100).optional(),
  mortgage_rate_pct: z.number().min(0).optional(),
  mortgage_term_years: z.number().int().min(1).optional(),
  holding_period_years: z.number().int().min(1).max(30).optional(),
  appreciation_rate_pct: z.number().min(-10).max(50).optional(),
  property_id: z.string().uuid().optional(),
});

// POST /api/roi/calculate — Calculate ROI
router.post('/calculate', validate(roiCalculateSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = roiService.calculate(req.body);
    res.json({ data: result });
  } catch (error) {
    next(error);
  }
});

// POST /api/roi/save — Calculate and save ROI
router.post('/save', validate(roiCalculateSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = roiService.calculate(req.body);
    const saved = await roiService.save(req.token, req.user.id, req.body, result);
    res.status(201).json({ data: { calculation: saved, result } });
  } catch (error) {
    next(error);
  }
});

// GET /api/roi/history — Get user's ROI calculation history
router.get('/history', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const history = await roiService.getHistory(req.token, req.user.id);
    res.json({ data: history });
  } catch (error) {
    next(error);
  }
});

export { router as roiRoutes };

