/**
 * Public configuration. Only NEXT_PUBLIC_* values may be read in client code;
 * Next inlines them at build time. Secrets live in src/lib/server/* only.
 */
function originOnly(url: string): string {
  const trimmed = url.trim();
  try {
    return trimmed ? new URL(trimmed).origin : "";
  } catch {
    return trimmed;
  }
}

export const publicEnv = {
  // Keep only the origin: a URL pasted with "/rest/v1/" or a trailing slash makes Supabase
  // answer "Invalid path specified in request URL".
  supabaseUrl: originOnly(process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""),
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "",
};

export const isConfigured = Boolean(publicEnv.supabaseUrl && publicEnv.supabaseAnonKey);

/** The origin auth emails and OAuth should send people back to. Works on any domain without code changes. */
export function appOrigin(): string {
  if (typeof window !== "undefined") return window.location.origin;
  return publicEnv.siteUrl || "http://localhost:3000";
}
