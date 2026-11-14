/**
 * Generates chess puzzles and machine-checks every one.
 *   node scripts/make-puzzles.ts [count-per-theme]
 * Writes src/lib/chess/puzzles.json.
 *
 * Positions come from games between two weak engines (so they look like
 * beginner games). A position becomes a puzzle only if the engine proves it:
 *  - mate1: exactly one move mates.
 *  - mate2: no mate in one, and exactly one first move forces mate next move against every reply.
 *  - material: one move wins at least 2 pawns of material by force, and no other move comes close.
 */
import { writeFileSync } from "node:fs";
import { Chess } from "chess.js";
import { forcesMateInTwo, material, matingMoves, pickMove, scoreMoves } from "../src/lib/chess/engine.ts";

type Theme = "mate1" | "mate2" | "material";
interface Puzzle {
  id: string;
  theme: Theme;
  fen: string;
  /** Solution in UCI (e.g. e2e4, e7e8q). For mates, any mating move is also accepted at solve time. */
  line: string[];
  rating: number;
}

const want = Number(process.argv[2] ?? 60);
let seed = 12345;
const rand = () => ((seed = (seed * 1103515245 + 12345) % 2 ** 31) / 2 ** 31);
const uci = (m: { from: string; to: string; promotion?: string }) => `${m.from}${m.to}${m.promotion ?? ""}`;

const out: Record<Theme, Puzzle[]> = { mate1: [], mate2: [], material: [] };
const seen = new Set<string>();

function tryPosition(g: Chess) {
  const fen = g.fen();
  const key = fen.split(" ").slice(0, 2).join(" ");
  if (seen.has(key)) return;
  seen.add(key);
  const pieces = fen.split(" ")[0]!.replace(/[^a-zA-Z]/g, "").length;
  if (pieces < 7) return;

  const mates = matingMoves(g);
  if (mates.length === 1 && out.mate1.length < want) {
    const m = mates[0]!;
    // Harder when the mating piece isn't the queen and nothing is captured.
    const rating = 700 + (m.piece !== "q" ? 150 : 0) + (m.captured ? 0 : 100) + Math.round(rand() * 100);
    out.mate1.push({ id: `m1-${out.mate1.length}`, theme: "mate1", fen, line: [uci(m)], rating });
    return;
  }
  if (mates.length > 0) return;

  if (out.mate2.length < want) {
    // Forcing first moves only (checks and captures) keeps generation fast; these are the classic beginner mates.
    const moves = g.moves({ verbose: true }).filter((m) => m.san.includes("+") || m.captured);
    const winners = moves.filter((m) => forcesMateInTwo(g, m));
    if (winners.length === 1) {
      const first = winners[0]!;
      g.move(first);
      const reply = scoreMoves(g, 1)[0]!.move; // the defence that looks best
      g.move(reply);
      const mate = matingMoves(g)[0]!;
      g.undo();
      g.undo();
      const quiet = !first.san.includes("+") && !first.captured;
      const rating = 1250 + (quiet ? 250 : 0) + Math.round(rand() * 150);
      out.mate2.push({ id: `m2-${out.mate2.length}`, theme: "mate2", fen, line: [uci(first), uci(reply), uci(mate)], rating });
      return;
    }
    if (winners.length > 0) return;
  }

  if (out.material.length < want) {
    if (Math.abs(material(g)) > 4) return; // keep it to roughly balanced positions
    const scored = scoreMoves(g, 2);
    const [best, second] = scored;
    if (!best || !second) return;
    if (best.score > 50_000) return; // a forced mate, not a material puzzle
    const before = material(g) * (g.turn() === "w" ? 1 : -1);
    const gain = best.score / 100 - before;
    if (gain >= 2 && best.score - second.score >= 200) {
      g.move(best.move);
      const reply = scoreMoves(g, 2)[0]?.move;
      let follow: string | undefined;
      if (reply) {
        g.move(reply);
        follow = scoreMoves(g, 1)[0] ? uci(scoreMoves(g, 1)[0]!.move) : undefined;
        g.undo();
      }
      g.undo();
      const direct = Boolean(best.move.captured) && !reply?.captured;
      const rating = (direct ? 900 : 1150) + Math.round(rand() * 200);
      out.material.push({ id: `mt-${out.material.length}`, theme: "material", fen, line: [uci(best.move), ...(reply ? [uci(reply)] : []), ...(follow ? [follow] : [])], rating });
    }
  }
}

let games = 0;
while ((out.mate1.length < want || out.mate2.length < want || out.material.length < want) && games < 4000) {
  games++;
  const g = new Chess();
  for (let ply = 0; ply < 120 && !g.isGameOver(); ply++) {
    if (ply >= 12 && ply % 2 === games % 2) tryPosition(g);
    const level = rand() < 0.8 ? 0 : 1;
    const m = pickMove(g, level as 0 | 1, rand);
    if (!m) break;
    g.move(m);
  }
  if (games % 25 === 0) console.log(`games ${games}: mate1 ${out.mate1.length}, mate2 ${out.mate2.length}, material ${out.material.length}`);
}

const all = [...out.mate1, ...out.mate2, ...out.material];
writeFileSync(new URL("../src/lib/chess/puzzles.json", import.meta.url), JSON.stringify(all));
console.log(`wrote ${all.length} puzzles from ${games} games`);
