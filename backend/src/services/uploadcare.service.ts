import { env } from '../config/env';
import { logger } from '../utils/logger';
import { AppError } from '../utils/errors';

const UPLOADCARE_UPLOAD_URL = 'https://upload.uploadcare.com';
const UPLOADCARE_CDN_BASE = 'https://ucarecdn.com';

interface UploadcareFileInfo {
  uuid: string;
  cdnUrl: string;
  originalFilename: string;
  size: number;
  mimeType: string;
}

export const uploadcareService = {
  /**
   * Upload a file from a public URL to Uploadcare CDN.
   * Used to re-host UploadThing files on Uploadcare for image transformations.
   */
  async uploadFromUrl(sourceUrl: string): Promise<UploadcareFileInfo> {
    try {
      // Step 1: Initiate upload from URL
      const formData = new URLSearchParams();
      formData.append('pub_key', env.UPLOADCARE_PUBLIC_KEY);
      formData.append('source_url', sourceUrl);
      formData.append('store', '1');

      const tokenResponse = await fetch(`${UPLOADCARE_UPLOAD_URL}/from_url/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData.toString(),
      });

      if (!tokenResponse.ok) {
        const err = await tokenResponse.text();
        throw new Error(`Uploadcare from_url failed: ${tokenResponse.status} - ${err}`);
      }

      const tokenData = (await tokenResponse.json()) as { token: string };

      // Step 2: Poll for upload completion
      let attempts = 0;
      const maxAttempts = 30;
      while (attempts < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 1000));

        const statusResponse = await fetch(
          `${UPLOADCARE_UPLOAD_URL}/from_url/status/?token=${tokenData.token}`,
        );
        const statusData = (await statusResponse.json()) as {
          status: string;
          uuid?: string;
          original_filename?: string;
          size?: number;
          mime_type?: string;
          error?: string;
        };

        if (statusData.status === 'success' && statusData.uuid) {
          return {
            uuid: statusData.uuid,
            cdnUrl: `${UPLOADCARE_CDN_BASE}/${statusData.uuid}/`,
            originalFilename: statusData.original_filename ?? '',
            size: statusData.size ?? 0,
            mimeType: statusData.mime_type ?? '',
          };
        }

        if (statusData.status === 'error') {
          throw new Error(`Uploadcare upload failed: ${statusData.error}`);
        }

        attempts++;
      }

      throw new Error('Uploadcare upload timed out');
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Uploadcare upload from URL failed', { error: String(error), sourceUrl });
      throw new AppError('Failed to upload image to CDN', 500, 'UPLOADCARE_ERROR');
    }
  },

  /**
   * Generate a CDN URL with image transformations applied.
   * @param uuid - Uploadcare file UUID
   * @param transforms - Transformation operations (e.g., 'scale_crop/800x600/center')
   */
  getCdnUrl(uuid: string, ...transforms: string[]): string {
    if (transforms.length === 0) {
      return `${UPLOADCARE_CDN_BASE}/${uuid}/`;
    }
    const ops = transforms.map((t) => `-/${t}/`).join('');
    return `${UPLOADCARE_CDN_BASE}/${uuid}/${ops}`;
  },

  /** Generate a thumbnail URL for a property image. */
  getThumbnailUrl(uuid: string, width = 400, height = 300): string {
    return this.getCdnUrl(uuid, `scale_crop/${width}x${height}/center`, 'format/webp', 'quality/smart');
  },

  /** Generate a full-size optimized URL for a property image. */
  getOptimizedUrl(uuid: string): string {
    return this.getCdnUrl(uuid, 'format/auto', 'quality/smart');
  },
};

