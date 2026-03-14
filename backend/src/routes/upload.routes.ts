import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate';
import { uploadcareService } from '../services/uploadcare.service';
import '../types/api.types';

const router = Router();

const uploadToCdnSchema = z.object({
  file_urls: z.array(z.string().url()).min(1).max(50),
});

/**
 * POST /api/uploads/to-cdn — Re-host uploaded files on Uploadcare CDN.
 * After UploadThing upload completes on the frontend, the client sends
 * the UploadThing file URLs here to get Uploadcare CDN URLs with
 * transformation support (thumbnails, optimized delivery, etc.)
 */
router.post('/to-cdn', validate(uploadToCdnSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { file_urls } = req.body as z.infer<typeof uploadToCdnSchema>;

    const results = await Promise.all(
      file_urls.map(async (url: string) => {
        const file = await uploadcareService.uploadFromUrl(url);
        return {
          original_url: url,
          cdn_url: uploadcareService.getOptimizedUrl(file.uuid),
          thumbnail_url: uploadcareService.getThumbnailUrl(file.uuid),
          uuid: file.uuid,
          size: file.size,
          mime_type: file.mimeType,
        };
      }),
    );

    res.json({ data: results });
  } catch (error) {
    next(error);
  }
});

const transformSchema = z.object({
  uuid: z.string().min(1),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  format: z.enum(['auto', 'webp', 'jpeg', 'png']).optional(),
});

/**
 * POST /api/uploads/transform — Get a transformed CDN URL for an existing Uploadcare file.
 */
router.post('/transform', validate(transformSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { uuid, width, height, format } = req.body as z.infer<typeof transformSchema>;

    const transforms: string[] = [];
    if (width && height) {
      transforms.push(`scale_crop/${width}x${height}/center`);
    } else if (width) {
      transforms.push(`resize/${width}x`);
    } else if (height) {
      transforms.push(`resize/x${height}`);
    }
    if (format) {
      transforms.push(`format/${format}`);
    }
    transforms.push('quality/smart');

    const cdnUrl = uploadcareService.getCdnUrl(uuid, ...transforms);
    res.json({ data: { cdn_url: cdnUrl, uuid } });
  } catch (error) {
    next(error);
  }
});

export { router as uploadRoutes };

