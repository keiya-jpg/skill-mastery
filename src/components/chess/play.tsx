"use client";
import { Chess, type Square } from "chess.js";
import { useEffect, useMemo, useState } from "react";
import { hintMove, pickMove } from "@/lib/chess/engine";
import { Kicker, NextButton } from "../session/bits";
import { Board } from "./board";

const LEVEL_NAME = ["friendly", "casual", "solid"] as const;

/**
 * Play the computer as White. With `cct`, each move starts with a quick
 * "checks, captures, threats" scan prompt, which fades once it's a habit.
 */
export function ChessPlay({ level, cct, intro, title, onDone }: { level: 0 | 1 | 2; cct?: boolean; intro?: string; title: string; onDone: (r: { result: "win" | "draw" | "loss" | "unfinished"; moves: number; hints: number }) => void }) {
  // The game is derived from the list of moves, so take-backs are just a shorter list.
  const [line, setLine] = useState<{ from: string; to: string; promotion?: string }[]>([]);
  const g = useMemo(() => {
    const c = new Chess();
    for (const m of line) c.move(m);
    return c;
  }, [line]);
  const fen = g.fen();
  const lastMove = line[line.length - 1];
  const last: [string, string] | null = lastMove ? [lastMove.from, lastMove.to] : null;
  const [hint, setHint] = useState<[string, string] | null>(null);
  const [hints, setHints] = useState(0);
  const [scanned, setScanned] = useState(!cct);
  const [remind, setRemind] = useState(Boolean(cct));

  const over = g.isGameOver();
  const result: "win" | "draw" | "loss" | null = over ? (g.isCheckmate() ? (g.turn() === "b" ? "win" : "loss") : "draw") : null;

  useEffect(() => {
    if (g.turn() !== "b" || over) return;
    const t = setTimeout(() => {
      const m = pickMove(new Chess(fen), level);
      if (m) setLine((l) => [...l, { from: m.from, to: m.to, promotion: m.promotion }]);
      setScanned(!remind);
    }, 350);
    return () => clearTimeout(t);
  }, [fen, g, level, over, remind]);

  function move(from: Square, to: Square) {
    const probe = new Chess(fen);
    try {
      const m = probe.move({ from, to, promotion: "q" });
      setLine((l) => [...l, { from: m.from, to: m.to, promotion: m.promotion }]);
    } catch {
      return;
    }
    setHint(null);
  }

  function showHint() {
    const m = hintMove(new Chess(fen));
    if (m) {
      setHint([m.from, m.to]);
      setHints((h) => h + 1);
    }
  }

  function undo() {
    if (line.length < 2) return;
    setLine((l) => l.slice(0, -2));
    setHint(null);
  }

  const yourTurn = g.turn() === "w" && !over;
  const thinking = g.turn() === "b" && !over;
  const status = result
    ? result === "win"
      ? "Checkmate. You win!"
      : result === "loss"
        ? "Checkmate. The computer wins this one."
        : "It's a draw."
    : thinking
      ? "Computer is thinking…"
      : g.inCheck()
        ? "You're in check."
        : "Your move.";

  return (
    <div>
      <Kicker>Play · {LEVEL_NAME[level]} computer</Kicker>
      <h2 className="mt-2 text-xl font-semibold tracking-tight">{title}</h2>
      {intro && <p className="mt-1 text-muted">{intro}</p>}
      <p className="mt-3 text-[15px]" role="status" aria-live="polite">
        {status}
      </p>
      {yourTurn && !scanned && (
        <div className="rise mt-3 rounded-xl border border-accent/40 bg-accent-soft p-3 text-[15px]">
          <p className="font-medium">Before you move, scan:</p>
          <p className="mt-1">What did their last move threaten? Any checks, captures or threats for you?</p>
          <div className="mt-2 flex flex-wrap gap-3">
            <button type="button" className="min-h-10 rounded-lg bg-accent px-4 text-sm font-medium text-on-accent" onClick={() => setScanned(true)}>
              Scanned
            </button>
            <button
              type="button"
              className="text-sm text-muted underline"
              onClick={() => {
                setRemind(false);
                setScanned(true);
              }}
            >
              I&apos;ve got the habit, stop reminding me
            </button>
          </div>
        </div>
      )}
      <div className="mt-3 flex justify-center">
        <Board fen={fen} onMove={move} interactive={yourTurn && scanned} lastMove={last} hint={hint} />
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" disabled={!yourTurn} onClick={showHint} className="min-h-10 rounded-lg border border-border px-3 text-sm disabled:opacity-50">
          Hint
        </button>
        <button type="button" disabled={!yourTurn || line.length < 2} onClick={undo} className="min-h-10 rounded-lg border border-border px-3 text-sm disabled:opacity-50">
          Take back
        </button>
      </div>
      <NextButton onClick={() => onDone({ result: result ?? "unfinished", moves: Math.ceil(line.length / 2), hints })}>
        {over ? "Continue" : "Finish for now"}
      </NextButton>
    </div>
  );
}
