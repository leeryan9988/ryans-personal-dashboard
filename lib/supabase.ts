import { createClient, type SupabaseClient } from '@supabase/supabase-js';

type PublicEnv = Record<string, string | undefined>;

function readEnv(): PublicEnv {
  return (import.meta.env ?? {}) as PublicEnv;
}

const env = readEnv();
export const supabaseUrl = env.VITE_SUPABASE_URL ?? '';
export const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY ?? '';
export const isCloudConfigured = Boolean(supabaseUrl && supabaseAnonKey);

let browserClient: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (!isCloudConfigured) return null;
  browserClient ??= createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  });
  return browserClient;
}
