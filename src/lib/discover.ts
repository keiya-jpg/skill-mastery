import { ideaEntries, seedEntries, type CatalogEntry } from "./skill/catalog";
import { slugify } from "./skill/schema";
import type { Prefs } from "./store";

/**
 * Suggests a few skills that fit the person's preferences. Mostly a match,
 * sometimes a wildcard: some novelty keeps a curious person exploring, too
 * much feels random. Never more than a handful at once.
 */
export function suggest(
  opts: { prefs: Prefs; exclude: Set<string>; stored?: CatalogEntry[]; count: number; rand?: () => number },
): CatalogEntry[] {
  const rand = opts.rand ?? Math.random;
  const { prefs } = opts;
  const seen = new Set<string>();
  const pool = [...seedEntries(), ...(opts.stored ?? []), ...ideaEntries()].filter((e) => {
    const key = slugify(e.name);
    if (seen.has(e.slug) || seen.has(key)) return false;
    seen.add(e.slug);
    seen.add(key);
    return !opts.exclude.has(e.slug);
  });
  const fits = (e: CatalogEntry) =>
    prefs.kinds.includes(e.kind) && (!prefs.indoorOnly || e.indoor !== false) && (!prefs.noGearOnly || e.noGear !== false);
  const weight = (e: CatalogEntry) => {
    const overlap = e.tags.filter((t) => prefs.interests.includes(t)).length;
    return 1 + overlap * 3 + (e.built ? 0.5 : 0);
  };
  const matching = pool.filter(fits);
  const others = pool.filter((e) => !fits(e));
  const out: CatalogEntry[] = [];
  const take = (list: CatalogEntry[]) => {
    const total = list.reduce((n, e) => n + weight(e), 0);
    let r = rand() * total;
    for (let i = 0; i < list.length; i++) {
      r -= weight(list[i]!);
      if (r <= 0) return list.splice(i, 1)[0]!;
    }
    return list.pop();
  };
  while (out.length < opts.count && (matching.length || others.length)) {
    // About one in five is a wildcard outside their usual picks.
    const wild = others.length > 0 && (matching.length === 0 || rand() < 0.2);
    const e = take(wild ? others : matching);
    if (e) out.push(e);
  }
  return out;
}

export const INTERESTS = [
  "strategy", "memory", "focus", "sport", "fitness", "music", "art", "creativity", "language",
  "puzzles", "logic", "outdoors", "coordination", "communication", "practical", "calm", "science", "games",
];
