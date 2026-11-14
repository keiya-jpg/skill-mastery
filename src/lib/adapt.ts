/**
 * Difficulty that follows you. Practice works best when you succeed roughly
 * 70-85% of the time (challenge point, the "85% rule", flow research). Above
 * that it's too easy to teach much; well below it, there's too little success
 * to learn from and motivation drops.
 */

export const TARGET_LOW = 0.6;
export const TARGET_HIGH = 0.85;

export type Level = -1 | 0 | 1;

/** Next drill level from the last set's success rate (makes / attempts). */
export function nextLevel(current: Level, rate: number | null): Level {
  if (rate === null || !Number.isFinite(rate)) return current;
  if (rate >= TARGET_HIGH) return Math.min(1, current + 1) as Level;
  if (rate < 0.5) return Math.max(-1, current - 1) as Level;
  return current;
}

export function advice(rate: number | null): "up" | "down" | "stay" | null {
  if (rate === null) return null;
  if (rate >= TARGET_HIGH) return "up";
  if (rate < 0.5) return "down";
  return "stay";
}

/**
 * Staircase for engines with a numeric size (words, digits, grid squares):
 * grow after a near-perfect round, shrink after a poor one.
 */
export function staircase(size: number, accuracy: number, opts: { min: number; max: number; up?: number; down?: number }): number {
  const up = opts.up ?? 1;
  const down = opts.down ?? 1;
  if (accuracy >= 0.9) return Math.min(opts.max, size + up);
  if (accuracy < 0.6) return Math.max(opts.min, size - down);
  return size;
}

/**
 * Elo-style rating for puzzles. The expected score uses the usual logistic
 * curve; picking puzzles about 150 points below your rating puts expected
 * success near 70%.
 */
export function updateRating(rating: number, puzzle: number, solved: boolean, k = 32): number {
  const expected = 1 / (1 + 10 ** ((puzzle - rating) / 400));
  return Math.round(rating + k * ((solved ? 1 : 0) - expected));
}

export function puzzleTarget(rating: number): number {
  return rating - 150;
}
