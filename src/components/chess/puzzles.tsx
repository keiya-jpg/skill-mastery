"use client";
import { Chess, type Square } from "chess.js";
import { useMemo, useRef, useState } from "react";
import { puzzleTarget, updateRating } from "@/lib/adapt";
import { forcesMateInTwo, scoreMoves } from "@/lib/chess/engine";
import { pickPuzzle, type Puzzle, type PuzzleTheme } from "@/lib/chess/puzzles";
import { Feedback, Kicker, NextButton } from "../session/bits";
import { Board } from "./board";

const THEME_TITLE: Record<PuzzleTheme, string> = { mate1: "Mate in one", mate2: "Mate in two", material: "Win material" };

const uciOf = (from: string, to: string, promo?: string) => `${from}${to}${promo ?? ""}`;

/**
 * Rated puzzles, pitched about 150 points below your rating so you solve
 * roughly 70% first try. Every solution was machine-checked when generated,
 * and mates are checked live, so any correct mate counts.
 */
export function ChessPuzzles({
  theme,
  count,
  startRating,
  seen: seenBefore,
  onDone,
}: {
  theme: PuzzleTheme;
  count: number;
  startRating: number;
  seen: string[];
  onDone: (r: { attempts: number; firstTry: number; rating: number; seen: string[] }) => void;
}) {
  const [rating, setRating] = useState(startRating);
  const [seen, setSeen] = useState<string[]>(seenBefore);
  const [done, setDone] = useState(0);
  const [firstTry, setFirstTry] = useState(0);
  const [puzzle, setPuzzle] = useState<Puzzle | null>(() => pickPuzzle(theme, puzzleTarget(startRating), seenBefore));
  const game = useRef(puzzle ? new Chess(puzzle.fen) : new Chess());
  const [fen, setFen] = useState(puzzle?.fen ?? "");
  const [last, setLast] = useState<[string, string] | null>(null);
  const [state, setState] = useState<"solving" | "wrong" | "solved" | "shown">("solving");
  const [missed, setMissed] = useState(false);
  const [step, setStep] = useState(0);
  const orientation = useMemo(() => (puzzle ? (new Chess(puzzle.fen).turn() as "w" | "b") : "w"), [puzzle]);

  if (!puzzle) {
    return (
      <div>
        <p>No more puzzles of this kind right now. Nice work.</p>
        <NextButton onClick={() => onDone({ attempts: done, firstTry, rating, seen })} />
      </div>
    );
  }

  function finishPuzzle(solved: boolean) {
    setState(solved ? "solved" : "shown");
    const clean = solved && !missed;
    setRating((r) => updateRating(r, puzzle!.rating, clean));
    if (clean) setFirstTry((n) => n + 1);
    setDone((n) => n + 1);
    setSeen((s) => [...s.slice(-200), puzzle!.id]);
  }

  function next() {
    if (done >= count) {
      onDone({ attempts: done, firstTry, rating, seen });
      return;
    }
    const p = pickPuzzle(theme, puzzleTarget(rating), seen);
    setPuzzle(p);
    if (p) {
      game.current = new Chess(p.fen);
      setFen(p.fen);
    }
    setLast(null);
    setState("solving");
    setMissed(false);
    setStep(0);
  }

  function wrong() {
    setMissed(true);
    setState("wrong");
  }

  function move(from: Square, to: Square) {
    const g = game.current;
    let m;
    try {
      m = g.move({ from, to, promotion: "q" });
    } catch {
      return;
    }
    const u = uciOf(m.from, m.to, m.promotion);
    setLast([from, to]);
    setFen(g.fen());

    const ok = (() => {
      if (puzzle!.theme === "mate1") return g.isCheckmate();
      if (puzzle!.theme === "mate2") {
        if (step === 0) {
          g.undo();
          const forces = forcesMateInTwo(g, m);
          g.move(m);
          return forces;
        }
        return g.isCheckmate();
      }
      return u === puzzle!.line[0] || u.slice(0, 4) === puzzle!.line[0]!.slice(0, 4);
    })();

    if (!ok) {
      setTimeout(() => {
        g.undo();
        setFen(g.fen());
        setLast(null);
      }, 600);
      wrong();
      return;
    }
    if (puzzle!.theme === "mate2" && step === 0) {
      // The computer defends, then it's your mate.
      setTimeout(() => {
        const reply = scoreMoves(g, 1)[0]?.move;
        if (reply) {
          g.move(reply);
          setLast([reply.from, reply.to]);
          setFen(g.fen());
        }
        setStep(1);
        setState("solving");
      }, 450);
      return;
    }
    finishPuzzle(true);
  }

  function showSolution() {
    const g = new Chess(puzzle!.fen);
    const first = puzzle!.line[0]!;
    g.move({ from: first.slice(0, 2), to: first.slice(2, 4), promotion: first[4] ?? undefined });
    game.current = g;
    setFen(g.fen());
    setLast([first.slice(0, 2), first.slice(2, 4)]);
    finishPuzzle(false);
  }

  const side = orientation === "w" ? "White" : "Black";
  return (
    <div>
      <Kicker>
        {THEME_TITLE[theme]} · {Math.min(done + (state === "solving" || state === "wrong" ? 1 : 0), count)} of {count} · rating {rating}
      </Kicker>
      <h2 className="mt-2 text-xl font-semibold tracking-tight">
        {theme === "material" ? `${side} to play and win material` : `${side} to play and mate`}
        {theme === "mate2" && step === 1 ? ": now finish it" : ""}
      </h2>
      <p className="mt-1 text-sm text-muted">{theme === "material" ? "Look for loose pieces and double attacks." : "Try every check in your head first."}</p>
      <div className="mt-3 flex justify-center">
        <Board fen={fen} orientation={orientation} onMove={move} interactive={state === "solving" || state === "wrong"} lastMove={last} flash={state === "solved" ? "good" : null} />
      </div>
      {state === "wrong" && (
        <Feedback good={false}>
          Not that one. Look again.{" "}
          <button type="button" className="font-medium text-accent underline" onClick={showSolution}>
            Show me
          </button>
        </Feedback>
      )}
      {state === "solved" && <Feedback good>{missed ? "Got there. It'll count fully next time you see this pattern." : "Solved first try."}</Feedback>}
      {state === "shown" && <Feedback good={false}>The key move is shown on the board. Take a moment to see why it works.</Feedback>}
      {(state === "solved" || state === "shown") && <NextButton onClick={next}>{done >= count ? "Finish" : "Next puzzle"}</NextButton>}
    </div>
  );
}
