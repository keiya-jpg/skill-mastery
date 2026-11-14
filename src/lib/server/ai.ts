import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createAiRouter, providersFromEnv, type AiUsage } from "@/lib/ai/router-exports";

const config = providersFromEnv(process.env);

export const dailyRequestLimit = Number(process.env.AI_DAILY_REQUEST_LIMIT ?? 40);
/** New skills one account may create per day (each costs several AI requests). */
export const dailySkillLimit = Number(process.env.SKILL_DAILY_LIMIT ?? 5);

/** Router whose usage counter is per user, so one account can't drain the shared free quota. */
export function aiForUser(db: SupabaseClient) {
  const usage: AiUsage = {
    async record(provider, requests) {
      await db.rpc("record_ai_usage", { p_provider: provider, p_requests: requests });
    },
    async usedToday() {
      const today = new Date().toISOString().slice(0, 10);
      const res = await db.from("ai_usage").select("requests").eq("day", today);
      return (res.data ?? []).reduce((n: number, r: { requests: number }) => n + r.requests, 0);
    },
  };
  return createAiRouter({ ...config, usage, dailyRequestLimit, log: (m) => console.log(m) });
}

export function aiConfigured() {
  return config.chains.text.length > 0;
}
