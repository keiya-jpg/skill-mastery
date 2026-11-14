"use client";
import { Chess, type Square } from "chess.js";
import { useMemo, useState } from "react";

const GLYPH: Record<string, string> = { k: "♚", q: "♛", r: "♜", b: "♝", n: "♞", p: "♟" };
const NAME: Record<string, string> = { k: "king", q: "queen", r: "rook", b: "bishop", n: "knight", p: "pawn" };
const FILES = "abcdefgh";

export interface BoardProps {
  fen: string;
  orientation?: "w" | "b";
  /** Called with a legal move; promotion is always to a queen. */
  onMove?: (from: Square, to: Square) => void;
  interactive?: boolean;
  lastMove?: [string, string] | null;
  hint?: [string, string] | null;
  flash?: "good" | "bad" | null;
}

/**
 * Tap a piece, then tap where it goes: works on phones without drag. Legal
 * targets show as dots. Text glyphs keep it light (no image downloads).
 */
export function Board({ fen, orientation = "w", onMove, interactive = true, lastMove, hint, flash }: BoardProps) {
  const game = useMemo(() => new Chess(fen), [fen]);
  const [selected, setSelected] = useState<Square | null>(null);
  const [selFen, setSelFen] = useState(fen);
  // Drop the selection when the position changes.
  if (selFen !== fen) {
    setSelFen(fen);
    setSelected(null);
  }
  const targets = useMemo(() => (selected ? new Set(game.moves({ square: selected, verbose: true }).map((m) => m.to)) : new Set<string>()), [game, selected]);
  const board = game.board();
  const checkSq = game.inCheck() ? findKing(game) : null;

  const rows = orientation === "w" ? [0, 1, 2, 3, 4, 5, 6, 7] : [7, 6, 5, 4, 3, 2, 1, 0];
  const cols = orientation === "w" ? [0, 1, 2, 3, 4, 5, 6, 7] : [7, 6, 5, 4, 3, 2, 1, 0];

  function tap(sq: Square) {
    if (!interactive) return;
    const piece = game.get(sq);
    if (selected && targets.has(sq)) {
      onMove?.(selected, sq);
      setSelected(null);
      return;
    }
    if (piece && piece.color === game.turn()) setSelected(sq === selected ? null : sq);
    else setSelected(null);
  }

  return (
    <div
      role="grid"
      aria-label="Chess board"
      data-fen={fen}
      className={`grid aspect-square w-full max-w-[min(92vw,30rem)] select-none grid-cols-8 grid-rows-8 overflow-hidden rounded-lg border border-border ${flash === "good" ? "ring-4 ring-good/60" : flash === "bad" ? "ring-4 ring-warn/60" : ""}`}
    >
      {rows.map((r) =>
        cols.map((c) => {
          const sq = `${FILES[c]}${8 - r}` as Square;
          const p = board[r]![c];
          const light = (r + c) % 2 === 0;
          const isLast = lastMove && (lastMove[0] === sq || lastMove[1] === sq);
          const isHint = hint && (hint[0] === sq || hint[1] === sq);
          const label = `${sq}${p ? `, ${p.color === "w" ? "white" : "black"} ${NAME[p.type]}` : ""}`;
          return (
            <button
              key={sq}
              type="button"
              role="gridcell"
              aria-label={label}
              aria-selected={selected === sq}
              onClick={() => tap(sq)}
              className="relative flex items-center justify-center"
              style={{ background: light ? "var(--sq-light)" : "var(--sq-dark)" }}
            >
              {isLast && <span aria-hidden className="absolute inset-0 bg-yellow-300/35" />}
              {isHint && <span aria-hidden className="absolute inset-0 bg-sky-400/40" />}
              {selected === sq && <span aria-hidden className="absolute inset-0 bg-sky-500/40" />}
              {checkSq === sq && <span aria-hidden className="absolute inset-0 bg-red-500/40" />}
              {p && (
                <span
                  aria-hidden
                  className="relative text-[min(9vw,3.2rem)] leading-none"
                  style={{
                    color: p.color === "w" ? "#fbfaf7" : "#1b1b1b",
                    textShadow: p.color === "w" ? "0 0 1px #000, 0 0 1px #000, 0 1px 1px rgba(0,0,0,.6)" : "0 1px 0 rgba(255,255,255,.25)",
                  }}
                >
                  {GLYPH[p.type]}
                  {"︎"}
                </span>
              )}
              {targets.has(sq) && (
                <span aria-hidden className={`absolute rounded-full ${p ? "inset-1 border-4 border-black/25" : "h-1/4 w-1/4 bg-black/25"}`} />
              )}
              {c === (orientation === "w" ? 0 : 7) && (
                <span aria-hidden className="absolute left-0.5 top-0 text-[10px] opacity-60">{8 - r}</span>
              )}
              {r === (orientation === "w" ? 7 : 0) && (
                <span aria-hidden className="absolute bottom-0 right-0.5 text-[10px] opacity-60">{FILES[c]}</span>
              )}
            </button>
          );
        }),
      )}
    </div>
  );
}

function findKing(game: Chess): string | null {
  const b = game.board();
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) if (b[r]![c]?.type === "k" && b[r]![c]?.color === game.turn()) return `${FILES[c]}${8 - r}`;
  return null;
}
