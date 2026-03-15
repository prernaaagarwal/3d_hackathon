import { env } from '../config/env';
import { logger } from '../utils/logger';
import { AppError } from '../utils/errors';

const WORLD_API_BASE = 'https://api.worldlabs.ai/marble/v1';

interface WorldJobResult {
  status: 'queued' | 'processing' | 'complete' | 'failed';
  operation_id: string;
  world_id?: string;
  scene_url?: string;
  thumbnail_url?: string;
  processing_time_ms?: number;
  progress?: number;
  error?: string;
}

interface GenerateWorldResponse {
  operation_id: string;
  created_at: string;
  updated_at: string;
  expires_at: string;
}

interface OperationResponse {
  operation_id: string;
  created_at: string;
  updated_at: string;
  expires_at: string;
  done: boolean;
  error: { message: string; code: string } | null;
  metadata: {
    progress: number;
    world_id?: string;
  } | null;
  response: {
    world_id: string;
    display_name?: string;
    scene_url?: string;
    thumbnail_url?: string;
  } | null;
}

/** Evenly sample `count` items from an array to get representative coverage. */
function sampleEvenly(items: string[], count: number): string[] {
  if (items.length <= count) return items;
  const step = items.length / count;
  return Array.from({ length: count }, (_, i) => items[Math.floor(i * step)]);
}

export const worldApiService = {
  /**
   * Submit a 3D world generation job to World Labs Marble API.
   * Uses multi-image prompt with URIs (photos are already on CDN via UploadThing/Uploadcare).
   * Returns the operation_id for polling.
   */
  async createJob(photoUrls: string[], quality: 'standard' | 'high' = 'standard'): Promise<string> {
    try {
      const model = quality === 'high' ? 'Marble 0.1-plus' : 'Marble 0.1-mini';

      // World Labs allows max 4 images in normal mode, max 8 in reconstruction mode.
      // Use reconstruction mode and cap at 8 images (evenly sample if more provided).
      const MAX_IMAGES = 8;
      const selectedUrls = photoUrls.length > MAX_IMAGES
        ? sampleEvenly(photoUrls, MAX_IMAGES)
        : photoUrls;

      // Distribute azimuths evenly across 360° for multi-image input
      const multiImagePrompt = selectedUrls.map((url, index) => ({
        azimuth: Math.round((360 / selectedUrls.length) * index),
        content: {
          source: 'uri' as const,
          uri: url,
        },
      }));

      const body = {
        display_name: `PropIntel Tour - ${new Date().toISOString()}`,
        model,
        permission: { public: false },
        world_prompt: {
          type: 'multi-image' as const,
          multi_image_prompt: multiImagePrompt,
          text_prompt: 'A photorealistic interior property tour of a Dubai real estate property',
          reconstruct_images: true,
        },
      };

      logger.info('Submitting World Labs generation job', {
        photoCount: photoUrls.length,
        model,
      });

      const response = await fetch(`${WORLD_API_BASE}/worlds:generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'WLT-Api-Key': env.WORLD_LABS_API_KEY,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        logger.error('World Labs API error response', {
          status: response.status,
          body: errorBody,
        });
        throw new Error(`World Labs API error: ${response.status} - ${errorBody}`);
      }

      const data = (await response.json()) as GenerateWorldResponse;
      logger.info('World Labs job created', { operationId: data.operation_id });
      return data.operation_id;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('World Labs job creation failed', { error: String(error) });
      throw new AppError('Failed to create 3D generation job', 500, 'WORLD_API_ERROR');
    }
  },

  /**
   * Fetch world assets (spz URLs, thumbnail, etc.) from World Labs API.
   * Used by the self-hosted 3D viewer to load .spz files.
   */
  async getWorldAssets(worldId: string): Promise<{
    spzUrls: { full_res?: string; '500k'?: string; '100k'?: string };
    thumbnailUrl?: string;
    caption?: string;
    marbleUrl?: string;
  }> {
    try {
      const response = await fetch(`${WORLD_API_BASE}/worlds/${worldId}`, {
        headers: {
          'WLT-Api-Key': env.WORLD_LABS_API_KEY,
        },
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`World Labs API error: ${response.status} - ${errorBody}`);
      }

      const data = await response.json() as {
        world_marble_url?: string;
        assets?: {
          caption?: string;
          thumbnail_url?: string;
          splats?: {
            spz_urls?: { full_res?: string; '500k'?: string; '100k'?: string };
          };
        };
      };

      return {
        spzUrls: data.assets?.splats?.spz_urls ?? {},
        thumbnailUrl: data.assets?.thumbnail_url,
        caption: data.assets?.caption,
        marbleUrl: data.world_marble_url,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('World Labs get world assets failed', { error: String(error), worldId });
      throw new AppError('Failed to fetch 3D world assets', 500, 'WORLD_API_ERROR');
    }
  },

  /**
   * Poll World Labs operation status.
   * When done=true, response contains the generated world data.
   */
  async getJobStatus(operationId: string): Promise<WorldJobResult> {
    try {
      const response = await fetch(`${WORLD_API_BASE}/operations/${operationId}`, {
        headers: {
          'WLT-Api-Key': env.WORLD_LABS_API_KEY,
        },
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`World Labs API error: ${response.status} - ${errorBody}`);
      }

      const data = (await response.json()) as OperationResponse;

      // Map operation state to our tour status
      if (data.error) {
        return {
          status: 'failed',
          operation_id: data.operation_id,
          error: data.error.message,
        };
      }

      if (data.done && data.response) {
        const createdAt = new Date(data.created_at).getTime();
        const updatedAt = new Date(data.updated_at).getTime();

        return {
          status: 'complete',
          operation_id: data.operation_id,
          world_id: data.response.world_id,
          scene_url: data.response.scene_url,
          thumbnail_url: data.response.thumbnail_url,
          processing_time_ms: updatedAt - createdAt,
        };
      }

      // Still processing
      return {
        status: 'processing',
        operation_id: data.operation_id,
        world_id: data.metadata?.world_id,
        progress: data.metadata?.progress ?? 0,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('World Labs job status check failed', { error: String(error), operationId });
      throw new AppError('Failed to check 3D generation status', 500, 'WORLD_API_ERROR');
    }
  },
};

