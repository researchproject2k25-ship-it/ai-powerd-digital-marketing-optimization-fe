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

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

let supabase: SupabaseClient;

if (supabaseUrl && supabaseAnonKey) {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
} else {
  // During build / prerender the env vars may not be available.
  // Create a dummy client that will be replaced at runtime.
  console.warn(
    'Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY — ' +
    'Supabase client is unavailable (OK during build).',
  );
  supabase = new Proxy({} as SupabaseClient, {
    get(_, prop) {
      if (prop === 'from') {
        return () => {
          throw new Error('Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.');
        };
      }
      return undefined;
    },
  });
}

export { supabase };
