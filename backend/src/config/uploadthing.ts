import { createUploadthing, type FileRouter } from 'uploadthing/express';

const f = createUploadthing();

/**
 * UploadThing FileRouter — defines allowed upload types and handlers.
 * Property images: up to 50 images, 20MB each (JPEG/PNG/HEIC).
 */
export const uploadRouter = {
  /** Property listing images (hero, gallery) */
  propertyImage: f({
    image: {
      maxFileSize: '8MB',
      maxFileCount: 10,
    },
  }).onUploadComplete(({ file }) => {
    return { url: file.ufsUrl, key: file.key, name: file.name, size: file.size };
  }),

  /** Photos for 3D tour generation (10–50 photos required) */
  tourPhotos: f({
    image: {
      maxFileSize: '16MB',
      maxFileCount: 50,
    },
  }).onUploadComplete(({ file }) => {
    return { url: file.ufsUrl, key: file.key, name: file.name, size: file.size };
  }),
} satisfies FileRouter;

export type OurFileRouter = typeof uploadRouter;

