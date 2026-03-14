import { Router, Request, Response, NextFunction } from 'express';
import { worldApiService } from '../services/worldApi.service';
import { tourService } from '../services/tour.service';
import '../types/api.types';

const router = Router();

// GET /api/jobs/:tourId/status — Check 3D generation job status
router.get('/:tourId/status', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tour = await tourService.getById(req.token, req.params.tourId as string);

    if (!tour.world_api_job_id) {
      res.json({
        data: {
          status: tour.status,
          message: 'Job has not been submitted to World Labs yet',
        },
      });
      return;
    }

    // Poll World Labs API for current status
    const jobResult = await worldApiService.getJobStatus(tour.world_api_job_id);

    // If status changed, update the tour record
    if (jobResult.status !== tour.status) {
      const updates: Record<string, unknown> = {
        status: jobResult.status,
      };
      if (jobResult.scene_url) updates.scene_url = jobResult.scene_url;
      if (jobResult.thumbnail_url) updates.thumbnail_url = jobResult.thumbnail_url;
      if (jobResult.processing_time_ms) updates.processing_time_ms = jobResult.processing_time_ms;
      if (jobResult.world_id) updates.world_id = jobResult.world_id;
      if (jobResult.error) updates.error_message = jobResult.error;

      await tourService.updateStatus(req.token, tour.id, updates);

      // If tour completed, mark property as having a 3D tour
      if (jobResult.status === 'complete') {
        const { createUserClient } = await import('../config/supabase');
        const supabase = createUserClient(req.token);
        await supabase
          .from('properties')
          .update({ has_3d_tour: true, updated_at: new Date().toISOString() })
          .eq('id', tour.property_id);
      }
    }

    res.json({ data: jobResult });
  } catch (error) {
    next(error);
  }
});

// POST /api/jobs/:tourId/submit — Submit tour photos to World Labs for processing
router.post('/:tourId/submit', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tour = await tourService.getById(req.token, req.params.tourId as string);
    const { photo_urls } = req.body;

    if (!photo_urls || !Array.isArray(photo_urls) || photo_urls.length < 2) {
      res.status(400).json({ error: 'At least 2 photo URLs are required (max 8 will be used)', code: 'VALIDATION_ERROR' });
      return;
    }

    const jobId = await worldApiService.createJob(photo_urls, tour.quality);

    await tourService.updateStatus(req.token, tour.id, {
      world_api_job_id: jobId,
      status: 'processing',
    });

    res.json({ data: { job_id: jobId, status: 'processing' } });
  } catch (error) {
    next(error);
  }
});

export { router as jobRoutes };

