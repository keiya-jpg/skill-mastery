"use client";
import { getSupabase } from "./supabase";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public kind?: string,
    public retryAfterMs?: number,
  ) {
    super(message);
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Calls our server API with the user's access token. When every free AI
 * provider is momentarily busy (503 with retryAfterMs) it waits and retries a
 * couple of times before giving up.
 */
export async function apiFetch<T>(path: string, init: RequestInit = {}, opts: { retries?: number; onWait?: (ms: number) => void } = {}): Promise<T> {
  const retries = opts.retries ?? 2;
  for (let attempt = 0; ; attempt++) {
    const { data } = await getSupabase().auth.getSession();
    const token = data.session?.access_token;
    if (!token) throw new ApiError("Your session has expired. Please log in again.", 401);
    let res: Response;
    try {
      res = await fetch(path, { ...init, headers: { ...(init.headers ?? {}), Authorization: `Bearer ${token}` } });
    } catch {
      throw new ApiError("Can't reach the server. Check your connection.", 0);
    }
    if (res.ok) return (await res.json()) as T;
    const body = (await res.json().catch(() => ({}))) as { error?: string; kind?: string; retryAfterMs?: number };
    const err = new ApiError(body.error ?? `Request failed (${res.status})`, res.status, body.kind, body.retryAfterMs);
    const retryable = res.status === 503 && attempt < retries && (body.retryAfterMs ?? 0) <= 30_000;
    if (!retryable) throw err;
    const wait = Math.max(3_000, body.retryAfterMs ?? 10_000);
    opts.onWait?.(wait);
    await sleep(wait);
  }
}
