import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate';
import { propertyService } from '../services/property.service';
import '../types/api.types';

const router = Router();

const createPropertySchema = z.object({
  address: z.string().min(1),
  area: z.string().min(1),
  property_type: z.enum(['apartment', 'villa', 'townhouse', 'commercial']),
  bedrooms: z.number().int().min(0),
  bathrooms: z.number().int().min(0),
  sqft: z.number().positive(),
  price_aed: z.number().positive(),
  annual_rent_aed: z.number().positive().optional(),
  service_charge_aed: z.number().positive().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  description: z.string().optional(),
  images: z.array(z.string().url()).optional(),
});

const updatePropertySchema = createPropertySchema.partial();

// GET /api/properties — List user's properties
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const result = await propertyService.list(req.token, req.user.id, page, limit);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// GET /api/properties/:id — Get single property
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const property = await propertyService.getById(req.token, req.params.id as string);
    res.json({ data: property });
  } catch (error) {
    next(error);
  }
});

// POST /api/properties — Create property
router.post('/', validate(createPropertySchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const property = await propertyService.create(req.token, req.user.id, req.body);
    res.status(201).json({ data: property });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/properties/:id — Update property
router.patch('/:id', validate(updatePropertySchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const property = await propertyService.update(req.token, req.params.id as string, req.body);
    res.json({ data: property });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/properties/:id — Delete property
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await propertyService.delete(req.token, req.params.id as string);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export { router as propertyRoutes };

