import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate';
import { aiService } from '../services/ai.service';
import '../types/api.types';

const router = Router();

const propertyDescriptionSchema = z.object({
  address: z.string().min(1),
  area: z.string().min(1),
  propertyType: z.string().min(1),
  bedrooms: z.number().int().min(0),
  bathrooms: z.number().int().min(0),
  sqft: z.number().positive(),
  priceAed: z.number().positive(),
  annualRentAed: z.number().positive().optional(),
});

const roiNarrativeSchema = z.object({
  area: z.string().min(1),
  purchasePrice: z.number().positive(),
  annualRent: z.number().positive(),
  grossYield: z.number(),
  netYield: z.number(),
  monthlyCashflow: z.number(),
  irr5yr: z.number(),
  irr10yr: z.number(),
  holdingPeriodYears: z.number().int().min(1),
  appreciationRatePct: z.number(),
  hasMortgage: z.boolean(),
});

// POST /api/ai/property-description — Generate AI property description
router.post('/property-description', validate(propertyDescriptionSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const description = await aiService.generatePropertyDescription(req.body);
    res.json({ data: { description } });
  } catch (error) {
    next(error);
  }
});

// POST /api/ai/roi-narrative — Generate AI ROI analysis narrative
router.post('/roi-narrative', validate(roiNarrativeSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const narrative = await aiService.generateRoiNarrative(req.body);
    res.json({ data: { narrative } });
  } catch (error) {
    next(error);
  }
});

export { router as aiRoutes };

