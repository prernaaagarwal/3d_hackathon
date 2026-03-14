import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('3001'),
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  SUPABASE_ANON_KEY: z.string().min(1),
  WORLD_LABS_API_KEY: z.string().min(1),
  GEMINI_API_KEY: z.string().min(1),
  CRUSTDATA_API_KEY: z.string().optional().default(''),
  UPLOADTHING_TOKEN: z.string().min(1),
  UPLOADCARE_PUBLIC_KEY: z.string().min(1),
  UPLOADCARE_SECRET_KEY: z.string().min(1),
  FRONTEND_URL: z.string().url().optional().default('http://localhost:3000'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;

