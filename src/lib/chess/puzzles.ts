import data from "./puzzles.json";

export type PuzzleTheme = "mate1" | "mate2" | "material";
export interface Puzzle {
  id: string;
  theme: PuzzleTheme;
  fen: string;
  line: string[];
  rating: number;
}

export const PUZZLES = data as Puzzle[];

/** The unseen puzzle of this theme closest to the target rating (seen ones come back once all are used). */
export function pickPuzzle(theme: PuzzleTheme, target: number, seen: string[]): Puzzle | null {
  const all = PUZZLES.filter((p) => p.theme === theme);
  if (!all.length) return null;
  const fresh = all.filter((p) => !seen.includes(p.id));
  const pool = fresh.length ? fresh : all;
  const sorted = [...pool].sort((a, b) => Math.abs(a.rating - target) - Math.abs(b.rating - target));
  // A little randomness among the closest few so repeats feel fresh.
  return sorted[Math.floor(Math.random() * Math.min(3, sorted.length))]!;
}
