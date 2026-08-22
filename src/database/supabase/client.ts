import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { env } from '../../config/env.js';

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!client) {
    client = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);
  }
  return client;
}
