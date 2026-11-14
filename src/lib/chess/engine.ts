import { Chess, type Move, type PieceSymbol } from "chess.js";

/**
 * A small chess engine: enough to be a friendly sparring partner for
 * beginners, give hints, and machine-check every puzzle solution.
 * Material plus piece-square tables, alpha-beta with capture search.
 */

export const VALUE: Record<PieceSymbol, number> = { p: 100, n: 310, b: 330, r: 500, q: 900, k: 0 };

// Piece-square tables from White's point of view, a8..h1 (row 0 = rank 8).
const PST: Record<PieceSymbol, number[]> = {
  p: [0, 0, 0, 0, 0, 0, 0, 0, 50, 50, 50, 50, 50, 50, 50, 50, 10, 10, 20, 30, 30, 20, 10, 10, 5, 5, 10, 25, 25, 10, 5, 5, 0, 0, 0, 20, 20, 0, 0, 0, 5, -5, -10, 0, 0, -10, -5, 5, 5, 10, 10, -20, -20, 10, 10, 5, 0, 0, 0, 0, 0, 0, 0, 0],
  n: [-50, -40, -30, -30, -30, -30, -40, -50, -40, -20, 0, 0, 0, 0, -20, -40, -30, 0, 10, 15, 15, 10, 0, -30, -30, 5, 15, 20, 20, 15, 5, -30, -30, 0, 15, 20, 20, 15, 0, -30, -30, 5, 10, 15, 15, 10, 5, -30, -40, -20, 0, 5, 5, 0, -20, -40, -50, -40, -30, -30, -30, -30, -40, -50],
  b: [-20, -10, -10, -10, -10, -10, -10, -20, -10, 0, 0, 0, 0, 0, 0, -10, -10, 0, 5, 10, 10, 5, 0, -10, -10, 5, 5, 10, 10, 5, 5, -10, -10, 0, 10, 10, 10, 10, 0, -10, -10, 10, 10, 10, 10, 10, 10, -10, -10, 5, 0, 0, 0, 0, 5, -10, -20, -10, -10, -10, -10, -10, -10, -20],
  r: [0, 0, 0, 0, 0, 0, 0, 0, 5, 10, 10, 10, 10, 10, 10, 5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, 0, 0, 0, 5, 5, 0, 0, 0],
  q: [-20, -10, -10, -5, -5, -10, -10, -20, -10, 0, 0, 0, 0, 0, 0, -10, -10, 0, 5, 5, 5, 5, 0, -10, -5, 0, 5, 5, 5, 5, 0, -5, 0, 0, 5, 5, 5, 5, 0, -5, -10, 5, 5, 5, 5, 5, 0, -10, -10, 0, 5, 0, 0, 0, 0, -10, -20, -10, -10, -5, -5, -10, -10, -20],
  k: [-30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40, -30, -20, -30, -30, -40, -40, -30, -30, -20, -10, -20, -20, -20, -20, -20, -20, -10, 20, 20, 0, 0, 0, 0, 20, 20, 20, 30, 10, 0, 0, 10, 30, 20],
};

const MATE = 100_000;

/*
 * chess.js's public move list builds SAN for every move, which is far too slow
 * for search (about 3 ms a call). The search uses its internal 0x88 move
 * generator instead, through this small typed adapter. chess.js is pinned
 * to an exact version in package.json because of this.
 */
interface IMove {
  from: number;
  to: number;
  piece: PieceSymbol;
  captured?: PieceSymbol;
  promotion?: PieceSymbol;
  color: "w" | "b";
}
interface Internals {
  _moves(o?: { legal?: boolean }): IMove[];
  _makeMove(m: IMove): void;
  _undoMove(): unknown;
  _isKingAttacked(c: "w" | "b"): boolean;
  _turn: "w" | "b";
  _board: ({ type: PieceSymbol; color: "w" | "b" } | undefined)[];
}
const raw = (g: Chess) => g as unknown as Internals;
const sq = (i: number) => `${"abcdefgh"[i & 15]}${8 - (i >> 4)}`;

/** Static evaluation from the side to move's point of view (centipawns). */
function evalRaw(r: Internals): number {
  let score = 0;
  const b = r._board;
  for (let i = 0; i < 128; i++) {
    if (i & 0x88) {
      i += 7;
      continue;
    }
    const p = b[i];
    if (!p) continue;
    const row = i >> 4;
    const f = i & 15;
    const idx = p.color === "w" ? row * 8 + f : (7 - row) * 8 + f;
    const v = VALUE[p.type] + PST[p.type][idx]!;
    score += p.color === "w" ? v : -v;
  }
  return r._turn === "w" ? score : -score;
}

export function evaluate(game: Chess): number {
  return evalRaw(raw(game));
}

/** Material only, from White's side, in pawns. */
export function material(game: Chess): number {
  let s = 0;
  for (const row of game.board()) for (const p of row) if (p) s += (p.color === "w" ? 1 : -1) * VALUE[p.type];
  return s / 100;
}

function order(moves: IMove[]): IMove[] {
  const score = (m: IMove) => (m.captured ? 10 * VALUE[m.captured] - VALUE[m.piece] : 0) + (m.promotion ? 800 : 0);
  return moves.sort((a, b) => score(b) - score(a));
}

function quiesce(r: Internals, alpha: number, beta: number, depth: number): number {
  const stand = evalRaw(r);
  if (depth <= 0) return stand;
  if (stand >= beta) return beta;
  if (stand > alpha) alpha = stand;
  for (const m of order(r._moves().filter((x) => x.captured || x.promotion))) {
    r._makeMove(m);
    const s = -quiesce(r, -beta, -alpha, depth - 1);
    r._undoMove();
    if (s >= beta) return beta;
    if (s > alpha) alpha = s;
  }
  return alpha;
}

function search(r: Internals, depth: number, alpha: number, beta: number, ply: number): number {
  const moves = r._moves();
  if (moves.length === 0) return r._isKingAttacked(r._turn) ? -MATE + ply : 0;
  if (depth <= 0) return quiesce(r, alpha, beta, 4);
  for (const m of order(moves)) {
    r._makeMove(m);
    const s = -search(r, depth - 1, -beta, -alpha, ply + 1);
    r._undoMove();
    if (s >= beta) return beta;
    if (s > alpha) alpha = s;
  }
  return alpha;
}

export interface ScoredMove {
  move: Move;
  score: number;
}

/** Every legal move with a score from the mover's side, best first. */
export function scoreMoves(game: Chess, depth: number): ScoredMove[] {
  const r = raw(game);
  const scored: { m: IMove; score: number }[] = [];
  for (const m of order(r._moves())) {
    r._makeMove(m);
    const s = -search(r, depth - 1, -MATE - 1, MATE + 1, 1);
    r._undoMove();
    scored.push({ m, score: s });
  }
  scored.sort((a, b) => b.score - a.score);
  const pub = game.moves({ verbose: true });
  return scored.map(({ m, score }) => ({
    move: pub.find((p) => p.from === sq(m.from) && p.to === sq(m.to) && (p.promotion ?? undefined) === (m.promotion ?? undefined))!,
    score,
  }));
}

/** Computer levels: 0 friendly (often misses things), 1 casual, 2 solid beginner-club. */
export function pickMove(game: Chess, level: 0 | 1 | 2, rand: () => number = Math.random): Move | null {
  if (game.isGameOver()) return null;
  const depth = level === 0 ? 1 : level === 1 ? 2 : 3;
  const scored = scoreMoves(game, depth);
  // Weaker levels sometimes pick a reasonable-but-not-best move, so beginners get chances.
  const slack = level === 0 ? 250 : level === 1 ? 90 : 25;
  const blunderChance = level === 0 ? 0.25 : level === 1 ? 0.08 : 0;
  if (rand() < blunderChance) return scored[Math.floor(rand() * scored.length)]!.move;
  const best = scored[0]!.score;
  const pool = scored.filter((s) => s.score >= best - slack);
  return pool[Math.floor(rand() * pool.length)]!.move;
}

/** Best move for a hint. */
export function hintMove(game: Chess): Move | null {
  return scoreMoves(game, 3)[0]?.move ?? null;
}

function mates(r: Internals): IMove[] {
  const out: IMove[] = [];
  for (const m of r._moves()) {
    r._makeMove(m);
    if (r._moves().length === 0 && r._isKingAttacked(r._turn)) out.push(m);
    r._undoMove();
  }
  return out;
}

/** All moves that give checkmate right now. */
export function matingMoves(game: Chess): Move[] {
  const found = mates(raw(game));
  if (!found.length) return [];
  return game.moves({ verbose: true }).filter((p) => found.some((m) => p.from === sq(m.from) && p.to === sq(m.to) && (p.promotion ?? undefined) === (m.promotion ?? undefined)));
}

/** True if the side to move can force mate in two (its move, any reply, its mating move). */
export function forcesMateInTwo(game: Chess, first: Move): boolean {
  game.move(first);
  const r = raw(game);
  try {
    const replies = r._moves();
    if (!replies.length) return false; // mate in one or stalemate
    for (const reply of replies) {
      r._makeMove(reply);
      const ok = mates(r).length > 0;
      r._undoMove();
      if (!ok) return false;
    }
    return true;
  } finally {
    game.undo();
  }
}
