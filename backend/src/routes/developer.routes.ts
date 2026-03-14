import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate';
import { crustdataService } from '../services/crustdata.service';
import { aiService } from '../services/ai.service';
import '../types/api.types';

const router = Router();

const developerSearchSchema = z.object({
  name: z.string().min(1, 'Developer name is required'),
});

// POST /api/developers/search — Get developer profile from Crustdata
router.post('/search', validate(developerSearchSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const profile = await crustdataService.getCompanyProfile(req.body.name);
    res.json({ data: profile });
  } catch (error) {
    next(error);
  }
});

// POST /api/developers/report — Generate full developer intelligence report (Crustdata + Gemini)
router.post('/report', validate(developerSearchSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Step 1: Get Crustdata enrichment
    const profile = await crustdataService.getCompanyProfile(req.body.name);

    // Step 2: Generate Gemini analysis
    const report = await aiService.generateDeveloperReport({
      developerName: req.body.name,
      crustdataProfile: profile as unknown as Record<string, unknown>,
    });

    res.json({
      data: {
        profile,
        report,
      },
    });
  } catch (error) {
    next(error);
  }
});

export { router as developerRoutes };

