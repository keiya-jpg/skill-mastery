import { IDEAS, type SkillIdea } from "./ideas";
import { slugify, type SkillSpec } from "./schema";
import { basketballSeed } from "./seeds/basketball";
import { chessSeed } from "./seeds/chess";
import { memorySeed } from "./seeds/memory";

/** Hand-built modules. They ship with the app, so they work offline and without AI keys. */
export const SEEDS: SkillSpec[] = [memorySeed, chessSeed, basketballSeed];

const SEED_ALIASES: Record<string, string[]> = {
  "memory-training": ["memory", "improve memory", "photographic memory", "eidetic memory", "memory palace", "method of loci", "remember things", "mnemonics"],
  chess: ["chess", "play chess", "chess tactics", "chess puzzles", "learn chess"],
  basketball: ["basketball", "shooting", "free throws", "basketball shooting", "dribbling", "ball handling", "layups", "hoops"],
};

export function seedBySlug(slug: string): SkillSpec | undefined {
  return SEEDS.find((s) => s.slug === slug);
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();

/** A seed the query clearly means, if any ("photographic memory" -> memory training). */
export function matchSeed(query: string): SkillSpec | undefined {
  const q = norm(query).replace(/^(how to |learn |learning |get better at |improve (my )?|master |mastering )/, "");
  if (!q) return undefined;
  return SEEDS.find((s) => norm(s.name) === q || s.slug === slugify(q) || (SEED_ALIASES[s.slug] ?? []).some((a) => norm(a) === q));
}

export interface CatalogEntry {
  slug: string;
  name: string;
  kind: SkillSpec["kind"];
  emoji: string;
  hook: string;
  tags: string[];
  /** Already built (seed or stored) vs. an idea that will be built on first open. */
  built: boolean;
  indoor?: boolean;
  noGear?: boolean;
}

export function seedEntries(): CatalogEntry[] {
  return SEEDS.map((s) => ({ slug: s.slug, name: s.name, kind: s.kind, emoji: s.emoji, hook: s.hook, tags: s.tags, built: true, indoor: s.kind !== "physical", noGear: s.equipment.length === 0 }));
}

export function ideaEntries(): CatalogEntry[] {
  return IDEAS.map((i: SkillIdea) => ({ slug: slugify(i.name), name: i.name, kind: i.kind, emoji: i.emoji, hook: i.hook, tags: i.tags, built: false, indoor: i.indoor, noGear: i.noGear }));
}

/** Local search over seeds and ideas (instant, works signed out). */
export function searchLocal(query: string, limit = 6): CatalogEntry[] {
  const q = norm(query);
  if (q.length < 2) return [];
  const words = q.split(" ");
  const all = [...seedEntries(), ...ideaEntries()];
  const scored = all
    .map((e) => {
      const hay = norm(`${e.name} ${e.tags.join(" ")} ${(SEED_ALIASES[e.slug] ?? []).join(" ")}`);
      let score = 0;
      if (norm(e.name).startsWith(q)) score += 3;
      if (hay.includes(q)) score += 2;
      score += words.filter((w) => w.length > 2 && hay.includes(w)).length;
      return { e, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((x) => x.e);
}
