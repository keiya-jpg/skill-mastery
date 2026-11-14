"use client";
import { seedBySlug } from "./skill/catalog";
import { skillSpecSchema, type SkillSpec, type Stage } from "./skill/schema";
import { apiFetch } from "./api-client";
import { isConfigured } from "./env";
import { getSupabase } from "./supabase";

const cache = new Map<string, SkillSpec>();

/** A skill's module: hand-built ones ship with the app; the rest come from the shared catalog. */
export async function getSkill(slug: string, fresh = false): Promise<SkillSpec | null> {
  const seed = seedBySlug(slug);
  if (seed) return seed;
  if (!fresh && cache.has(slug)) return cache.get(slug)!;
  if (!isConfigured) return null;
  const { data, error } = await getSupabase().from("skills").select("spec").eq("slug", slug).maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  const parsed = skillSpecSchema.safeParse(data.spec);
  if (!parsed.success) return null;
  cache.set(slug, parsed.data);
  return parsed.data;
}

export interface StoredSkill {
  slug: string;
  name: string;
  kind: SkillSpec["kind"];
  emoji: string;
  hook: string;
  tags: string[];
}

/** Skills other people have already built (for discovery). */
export async function storedSkills(limit = 60): Promise<StoredSkill[]> {
  if (!isConfigured) return [];
  const { data } = await getSupabase().from("skills").select("slug, name, kind, emoji, hook, tags").order("updated_at", { ascending: false }).limit(limit);
  return (data as StoredSkill[] | null) ?? [];
}

export async function searchStored(query: string): Promise<StoredSkill[]> {
  if (!isConfigured || query.trim().length < 2) return [];
  const { data } = await getSupabase().rpc("search_skills", { p_query: query.trim(), p_limit: 6 });
  return ((data as (StoredSkill & { score: number })[] | null) ?? []).map((r) => ({ ...r, tags: [] }));
}

export async function resolveSkill(query: string): Promise<{ slug: string; created: boolean }> {
  return apiFetch("/api/v1/skills/resolve", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ query }) });
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Builds a stage (once, for everyone). If someone else is building it, waits for theirs. */
export async function ensureStage(slug: string, index: number, onWait?: () => void): Promise<Stage> {
  for (let i = 0; i < 20; i++) {
    const res = await apiFetch<{ status: "ready"; stage: Stage } | { status: "building" }>(`/api/v1/skills/${slug}/stages/${index}`, { method: "POST" });
    if (res.status === "ready") {
      const spec = cache.get(slug);
      if (spec) spec.stages[index] = res.stage;
      return res.stage;
    }
    onWait?.();
    await sleep(4000);
  }
  throw new Error("Building this stage is taking too long. Please try again.");
}
