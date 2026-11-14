import { z } from "zod";

/**
 * A skill module is data, not code. The AI (or a hand-written seed) picks
 * from a fixed set of well-tested interactive activity types, and the app
 * renders them. That keeps every module safe, consistent and calm-looking,
 * and means a module made once can be stored and reused for every user.
 */

const id = z.string().min(1).max(40);
const short = (max: number) => z.string().trim().min(1).max(max);

export const ENGINES = [
  "chess-play",
  "chess-puzzles",
  "memory-palace",
  "memory-words",
  "memory-major",
  "memory-digits",
  "memory-snapshot",
] as const;
export type EngineId = (typeof ENGINES)[number];

export const explainActivity = z.object({
  type: z.literal("explain"),
  id,
  title: short(80),
  /** About 60 words. Short explanations beat long ones for novices (cognitive load). */
  text: short(700),
  /** Optional "predict first" question shown before the explanation (pretesting + curiosity gap). */
  predict: z
    .object({
      question: short(200),
      options: z.array(short(120)).min(2).max(4),
      answer: z.number().int().min(0),
    })
    .optional(),
});

export const quizActivity = z.object({
  type: z.literal("quiz"),
  id,
  question: short(300),
  options: z.array(z.object({ text: short(160), why: short(260) })).min(2).max(5),
  answer: z.number().int().min(0),
});

export const recallActivity = z.object({
  type: z.literal("recall"),
  id,
  prompt: short(300),
  answer: short(400),
  tip: z.string().max(200).optional(),
});

export const orderActivity = z.object({
  type: z.literal("order"),
  id,
  prompt: short(200),
  /** In the correct order. Shown shuffled. */
  steps: z.array(short(140)).min(3).max(7),
});

export const drillActivity = z.object({
  type: z.literal("drill"),
  id,
  title: short(80),
  setup: z.string().max(200).optional(),
  instructions: z.array(short(200)).min(1).max(5),
  /** One cue about the effect or target, not body parts ("send it over the front of the rim"). */
  cue: z.string().max(140).optional(),
  sets: z.number().int().min(1).max(10),
  perSet: z.number().int().min(1).max(200),
  unit: z.enum(["attempts", "reps", "seconds"]),
  /**
   * "makes": count successes out of attempts (adaptive difficulty uses it).
   * "done": just tick off each set. "rating": rate the set 1-5.
   */
  log: z.enum(["makes", "done", "rating"]),
  success: short(160),
  easier: short(200),
  harder: short(200),
  /** Offer a short guided imagery rehearsal before the first set. */
  imagery: z.boolean().optional(),
  /** Random call-outs for varied practice (e.g. which spot to shoot from next). */
  callouts: z.array(short(40)).min(2).max(12).optional(),
});

export const imageryActivity = z.object({
  type: z.literal("imagery"),
  id,
  title: short(80),
  script: short(600),
  seconds: z.number().int().min(20).max(180),
});

export const reflectActivity = z.object({
  type: z.literal("reflect"),
  id,
  prompt: short(160),
});

export const engineActivity = z.object({
  type: z.literal("engine"),
  id,
  engine: z.enum(ENGINES),
  title: short(80),
  intro: z.string().max(400).optional(),
  params: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional(),
});

export const activitySchema = z.discriminatedUnion("type", [
  explainActivity,
  quizActivity,
  recallActivity,
  orderActivity,
  drillActivity,
  imageryActivity,
  reflectActivity,
  engineActivity,
]);
export type Activity = z.infer<typeof activitySchema>;
export type ActivityType = Activity["type"];

export const cardSchema = z.object({
  id,
  front: short(200),
  back: short(300),
  tip: z.string().max(200).optional(),
});
export type SkillCard = z.infer<typeof cardSchema>;

export const stageSchema = z.object({
  id,
  title: short(80),
  /** Observable and checkable: "make 7 of 10 from the free-throw line". */
  goal: short(200),
  why: short(300),
  minutes: z.number().int().min(3).max(60),
  /** Empty while the stage hasn't been built yet. */
  activities: z.array(activitySchema).max(10),
  cards: z.array(cardSchema).max(12),
});
export type Stage = z.infer<typeof stageSchema>;

export const KINDS = ["mental", "physical", "mixed"] as const;
export type SkillKind = (typeof KINDS)[number];

export const skillSpecSchema = z.object({
  version: z.literal(1),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(60),
  name: short(60),
  kind: z.enum(KINDS),
  emoji: z.string().min(1).max(8),
  /** One line that opens a curiosity gap. */
  hook: short(160),
  summary: short(400),
  equipment: z.array(short(60)).max(8),
  tags: z.array(short(30)).max(8),
  /** An honest caveat where hype is common (e.g. "photographic memory"). */
  honesty: z.string().max(500).optional(),
  stages: z.array(stageSchema).min(1).max(8),
  /** "seed" for hand-written modules; otherwise the model that wrote it. */
  source: z.string().max(80).optional(),
});
export type SkillSpec = z.infer<typeof skillSpecSchema>;

export function stageReady(stage: Stage | undefined): boolean {
  return Boolean(stage && stage.activities.length > 0);
}

/** Lower-case, dash-separated, ascii slug. */
export function slugify(s: string): string {
  return s
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/g, "");
}

/**
 * Checks the parts zod can't: quiz answers point at a real option, ids are
 * unique. Returns a cleaned copy (bad activities dropped) so one slip by the
 * AI doesn't throw away a whole stage.
 */
export function cleanStage(stage: Stage): Stage {
  const seen = new Set<string>();
  const activities = stage.activities.filter((a) => {
    if (seen.has(a.id)) return false;
    seen.add(a.id);
    if (a.type === "quiz") return a.answer < a.options.length;
    if (a.type === "explain" && a.predict) return a.predict.answer < a.predict.options.length;
    return true;
  });
  const cardIds = new Set<string>();
  const cards = stage.cards.filter((c) => (cardIds.has(c.id) ? false : (cardIds.add(c.id), true)));
  return { ...stage, activities, cards };
}
