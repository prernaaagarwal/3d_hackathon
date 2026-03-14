import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate';
import { tourService } from '../services/tour.service';
import '../types/api.types';

const router = Router();

const createTourSchema = z.object({
  property_id: z.string().uuid(),
  quality: z.enum(['standard', 'high']).optional(),
  photo_count: z.number().int().min(10).max(50),
});

// GET /api/tours — List user's tours
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tours = await tourService.listByOwner(req.token, req.user.id);
    res.json({ data: tours });
  } catch (error) {
    next(error);
  }
});

// GET /api/tours/:id — Get tour details
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tour = await tourService.getById(req.token, req.params.id as string);
    res.json({ data: tour });
  } catch (error) {
    next(error);
  }
});

// POST /api/tours — Create a new tour (queues 3D generation)
router.post('/', validate(createTourSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tour = await tourService.create(req.token, {
      property_id: req.body.property_id,
      owner_id: req.user.id,
      quality: req.body.quality,
      photo_count: req.body.photo_count,
    });
    res.status(201).json({ data: tour });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/tours/:id/visibility — Toggle tour public/private
router.patch('/:id/visibility', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { is_public } = req.body;
    const tour = await tourService.togglePublic(req.token, req.params.id as string, is_public);
    res.json({ data: tour });
  } catch (error) {
    next(error);
  }
});

// GET /api/tours/public/:id — View a public tour (no auth required — handled at route mount)
// This is mounted separately in index.ts without authMiddleware

export { router as tourRoutes };

