/**
 * Singleton Supabase browser client.
 *
 * Uses the same Supabase project as the FastAPI backend
 * (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY).
 *
 * For production: replace NEXT_PUBLIC_SUPABASE_ANON_KEY with your
 * project's anon/public key (Supabase Dashboard → Settings → API).
 */
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. ' +
    'Copy them from the backend .env into the frontend .env.local.',
  );
}

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);
