"use client";
import type { Activity } from "@/lib/skill/schema";
import { useLoad } from "@/lib/use-load";
import { ChessPlay } from "../chess/play";
import { ChessPuzzles } from "../chess/puzzles";
import { MemoryDigits } from "../memory/digits";
import { MemoryMajor } from "../memory/major";
import { MemoryPalace } from "../memory/palace";
import { MemorySnapshot } from "../memory/snapshot";
import { MemoryWords } from "../memory/words";
import { Spinner } from "../ui";
import type { ActivityProps } from "./types";

type A = Extract<Activity, { type: "engine" }>;

const num = (v: unknown, d: number) => (typeof v === "number" && Number.isFinite(v) ? v : d);
const str = (v: unknown, d: string) => (typeof v === "string" ? v : d);

/** Hand-built interactive engines. Each one keeps its own difficulty state in the practice log. */
export function Engine({ activity: a, ctx, onDone }: ActivityProps<A>) {
  const p = a.params ?? {};
  const last = ctx.history[0]?.data ?? {};
  // Skill-wide state: the palace (built in one stage, used in others) and the puzzle rating (shared by every puzzle theme).
  const skillLogs = useLoad(() => ctx.store.logs(ctx.slug, undefined, 300), [ctx.store, ctx.slug]);
  if (skillLogs.loading) return <Spinner label="Loading…" />;
  const logs = skillLogs.data ?? [];
  const loci = (logs.find((l) => l.kind === "engine:memory-palace" && Array.isArray(l.data?.loci))?.data?.loci as string[]) ?? [];
  const lastPuzzles = logs.find((l) => l.kind === "engine:chess-puzzles")?.data ?? {};

  switch (a.engine) {
    case "chess-play":
      return (
        <ChessPlay
          title={a.title}
          intro={a.intro}
          level={Math.max(0, Math.min(2, num(p.level, 1))) as 0 | 1 | 2}
          cct={Boolean(p.cct)}
          onDone={(r) => onDone({ attempts: 1, successes: r.result === "win" ? 1 : 0, score: r.result === "win" ? 1 : r.result === "draw" ? 0.5 : 0, data: r })}
        />
      );
    case "chess-puzzles": {
      // Rating and seen puzzles carry over across sessions and between puzzle themes.
      const rating = num(lastPuzzles.rating, num(p.rating, 900));
      return (
        <ChessPuzzles
          theme={str(p.theme, "mate1") as "mate1" | "mate2" | "material"}
          count={num(p.count, 8)}
          startRating={rating}
          seen={Array.isArray(lastPuzzles.seen) ? (lastPuzzles.seen as string[]) : []}
          onDone={(r) => onDone({ attempts: r.attempts, successes: r.firstTry, score: r.attempts ? r.firstTry / r.attempts : 0, data: { rating: r.rating, seen: r.seen } })}
        />
      );
    }
    case "memory-palace":
      return <MemoryPalace size={num(p.size, 10)} initial={loci} onDone={(r) => onDone({ score: r.score, data: { loci: r.loci } })} />;
    case "memory-words": {
      const fixed = Boolean(p.fixed);
      const count = fixed ? num(p.count, 10) : num(last.next, num(p.count, 10));
      return (
        <MemoryWords
          count={count}
          method={str(p.method, "none") as "none" | "palace"}
          loci={loci}
          onDone={(r) => {
            const acc = r.correct / r.count;
            const next = acc >= 0.9 ? r.count + 2 : acc < 0.6 ? Math.max(6, r.count - 2) : r.count;
            onDone({ attempts: r.count, successes: r.correct, score: acc, data: { count: r.count, correct: r.correct, next } });
          }}
        />
      );
    }
    case "memory-digits":
      return (
        <MemoryDigits
          start={num(last.span, num(p.start, 6))}
          method={str(p.method, "none") as "none" | "major"}
          onDone={(r) => onDone({ attempts: r.trials.length, successes: r.trials.filter((t) => t.ok).length, score: r.best, data: { best: r.best, span: r.span } })}
        />
      );
    case "memory-major":
      return <MemoryMajor rounds={num(p.rounds, 10)} onDone={(r) => onDone({ attempts: r.attempts, successes: r.correct, score: r.correct / r.attempts })} />;
    case "memory-snapshot":
      return (
        <MemorySnapshot
          size={num(p.size, 5)}
          start={num(last.level, num(p.start, 4))}
          onDone={(r) => onDone({ score: r.best, data: { level: r.level, best: r.best } })}
        />
      );
  }
}
