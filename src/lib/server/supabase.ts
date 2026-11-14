import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { publicEnv } from "@/lib/env";

const url = publicEnv.supabaseUrl;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
/** Server-only. Used for one thing: writing the shared skill catalog after validating it. */
const secretKey = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

const noSession = { auth: { persistSession: false, autoRefreshToken: false } };

/** Acts as the signed-in user, so row-level security applies. */
export function userClient(token: string): SupabaseClient {
  return createClient(url, anonKey, { ...noSession, global: { headers: { Authorization: `Bearer ${token}` } } });
}

export function anonClient(): SupabaseClient {
  return createClient(url, anonKey, noSession);
}

export function catalogWriter(): SupabaseClient | null {
  if (!url || !secretKey) return null;
  return createClient(url, secretKey, noSession);
}
