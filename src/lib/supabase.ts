"use client";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { isConfigured, publicEnv } from "./env";

let client: SupabaseClient | null = null;

/** Browser singleton. The session lives in localStorage and refreshes itself. */
export function getSupabase(): SupabaseClient {
  if (!client) {
    client = createClient(publicEnv.supabaseUrl || "http://localhost:54321", publicEnv.supabaseAnonKey || "missing", {
      auth: { persistSession: isConfigured, autoRefreshToken: isConfigured, flowType: "pkce" },
    });
  }
  return client;
}

/** Which OAuth providers the server has switched on (public endpoint). */
export async function enabledProviders(): Promise<{ google: boolean }> {
  if (!isConfigured) return { google: false };
  try {
    const res = await fetch(`${publicEnv.supabaseUrl}/auth/v1/settings`, { headers: { apikey: publicEnv.supabaseAnonKey } });
    if (!res.ok) return { google: false };
    const json = (await res.json()) as { external?: Record<string, boolean> };
    return { google: Boolean(json.external?.google) };
  } catch {
    return { google: false };
  }
}
