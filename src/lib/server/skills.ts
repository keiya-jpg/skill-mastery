import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { AiError } from "@/lib/ai/router-exports";
import { matchSeed, seedBySlug } from "@/lib/skill/catalog";
import { outlinePrompt, outlineSchema, parseStageOutput, PROMPT_VERSION, stageOutputSchema, stagePrompt } from "@/lib/skill/prompts";
import { cleanStage, skillSpecSchema, slugify, stageReady, type SkillSpec, type Stage } from "@/lib/skill/schema";
import { aiForUser, dailySkillLimit } from "./ai";
import { catalogWriter } from "./supabase";

export class UserFacingError extends Error {
  constructor(
    message: string,
    public status: 400 | 404 | 409 | 422 | 429 | 503 = 400,
  ) {
    super(message);
  }
}

function writer() {
  const w = catalogWriter();
  if (!w) throw new UserFacingError("Building new skills isn't set up on this server yet (missing SUPABASE_SECRET_KEY).", 503);
  return w;
}

async function findStored(db: SupabaseClient, query: string): Promise<string | null> {
  const exact = await db.from("skills").select("slug").eq("slug", slugify(query)).maybeSingle();
  if (exact.data) return exact.data.slug as string;
  const res = await db.rpc("search_skills", { p_query: query, p_limit: 1 });
  const top = (res.data as { slug: string; score: number }[] | null)?.[0];
  return top && top.score >= 0.55 ? top.slug : null;
}

/**
 * Turns whatever someone typed into a skill slug. Re-uses a hand-built or
 * already-stored module whenever one matches, so the AI only runs for skills
 * nobody has asked for before.
 */
export async function resolveSkill(db: SupabaseClient, userId: string, query: string): Promise<{ slug: string; created: boolean }> {
  const q = query.trim().replace(/\s+/g, " ").slice(0, 120);
  if (q.length < 2) throw new UserFacingError("Type a skill to learn.");
  const seed = matchSeed(q);
  if (seed) return { slug: seed.slug, created: false };
  const stored = await findStored(db, q);
  if (stored) return { slug: stored, created: false };

  const w = writer();
  const since = new Date(Date.now() - 86_400_000).toISOString();
  const mine = await w.from("skills").select("slug", { count: "exact", head: true }).eq("created_by", userId).gte("created_at", since);
  if ((mine.count ?? 0) >= dailySkillLimit) {
    throw new UserFacingError(`You've created ${dailySkillLimit} new skills today, the daily limit. Skills other people already built still work.`, 429);
  }

  const ai = aiForUser(db);
  const { data: outline } = await ai.completeJson({ task: "skill-outline", messages: outlinePrompt(q), maxTokens: 1800, temperature: 0.4 }, outlineSchema, PROMPT_VERSION);
  if (!outline.ok || !outline.name || !outline.stages || !outline.kind) {
    throw new UserFacingError(outline.reason || "That doesn't look like a skill this app can teach. Try naming a specific skill.", 422);
  }
  const slug = slugify(outline.name);
  if (!slug) throw new UserFacingError("That doesn't look like a skill this app can teach.", 422);
  if (seedBySlug(slug)) return { slug, created: false };

  const spec: SkillSpec = {
    version: 1,
    slug,
    name: outline.name,
    kind: outline.kind,
    emoji: outline.emoji ?? "✨",
    hook: outline.hook || outline.summary?.slice(0, 160) || outline.name,
    summary: outline.summary || outline.name,
    equipment: (outline.equipment ?? []).filter(Boolean),
    tags: (outline.tags ?? []).filter(Boolean).map((t) => t.toLowerCase()),
    honesty: outline.honesty || undefined,
    stages: outline.stages.map((s, i) => ({ id: `s${i + 1}`, ...s, activities: [], cards: [] })),
    source: "ai",
  };
  const valid = skillSpecSchema.safeParse(spec);
  if (!valid.success) throw new AiError("invalid_output", `Outline failed validation: ${valid.error.issues[0]?.message}`);

  const aliases = [...new Set([q.toLowerCase(), ...(outline.aliases ?? []).map((a) => a.toLowerCase())])].slice(0, 8);
  const ins = await w
    .from("skills")
    .upsert(
      { slug, name: spec.name, kind: spec.kind, emoji: spec.emoji, hook: spec.hook, tags: spec.tags, spec: valid.data, aliases, created_by: userId },
      { onConflict: "slug", ignoreDuplicates: true },
    );
  if (ins.error) throw new Error(ins.error.message);
  return { slug, created: true };
}

/**
 * Builds one stage of a stored skill, once, for everyone. If another request
 * is already building it, says so and the client waits.
 */
export async function buildStage(db: SupabaseClient, slug: string, index: number): Promise<{ status: "ready"; stage: Stage } | { status: "building" }> {
  if (seedBySlug(slug)) throw new UserFacingError("This skill is already complete.");
  const w = writer();
  const row = await w.from("skills").select("spec").eq("slug", slug).maybeSingle();
  if (!row.data) throw new UserFacingError("That skill doesn't exist.", 404);
  const spec = row.data.spec as SkillSpec;
  const stage = spec.stages[index];
  if (!stage) throw new UserFacingError("That stage doesn't exist.", 404);
  if (stageReady(stage)) return { status: "ready", stage };

  const claim = await w.rpc("claim_skill_stage", { p_slug: slug, p_index: index });
  if (claim.error) throw new Error(claim.error.message);
  if (!claim.data) return { status: "building" };

  try {
    const ai = aiForUser(db);
    const { data } = await ai.completeJson({ task: "skill-stage", messages: stagePrompt(spec, index), maxTokens: 3400, temperature: 0.5 }, stageOutputSchema, PROMPT_VERSION);
    const parsed = parseStageOutput(data);
    const built = cleanStage({ ...stage, activities: parsed.activities, cards: parsed.cards });
    if (built.activities.length < 2) throw new AiError("invalid_output", "Too few usable activities");
    const set = await w.rpc("set_skill_stage", { p_slug: slug, p_index: index, p_stage: built });
    if (set.error) throw new Error(set.error.message);
    return { status: "ready", stage: built };
  } catch (e) {
    // Release the claim so someone can try again straight away.
    const cur = await w.from("skills").select("building").eq("slug", slug).maybeSingle();
    const building = { ...((cur.data?.building as Record<string, number>) ?? {}) };
    delete building[String(index)];
    await w.from("skills").update({ building }).eq("slug", slug);
    throw e;
  }
}
