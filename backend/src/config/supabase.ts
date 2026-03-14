import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { env } from './env';

// Service role client — bypasses RLS. Use ONLY for admin operations (webhooks, cron, admin scripts).
export const supabaseAdmin: SupabaseClient = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
);

// Per-request client — respects RLS using user's JWT
export const createUserClient = (jwt: string): SupabaseClient =>
  createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${jwt}` } },
  });

