import {
  generateUploadButton,
  generateUploadDropzone,
  generateReactHelpers,
} from "@uploadthing/react";

import type { OurFileRouter } from "../../backend/src/config/uploadthing";

const UPLOAD_URL = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/uploadthing`;

export const UploadButton = generateUploadButton<OurFileRouter>({
  url: UPLOAD_URL,
});

export const UploadDropzone = generateUploadDropzone<OurFileRouter>({
  url: UPLOAD_URL,
});

export const { useUploadThing } = generateReactHelpers<OurFileRouter>({
  url: UPLOAD_URL,
});

