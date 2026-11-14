"use client";
import { useEffect, useMemo, useState } from "react";
import { staircase } from "@/lib/adapt";
import { sample } from "@/lib/memory";
import { Feedback, Kicker, NextButton } from "../session/bits";

const ROUNDS = 5;
const LOOK_MS = 2000;

/** Brief look, then rebuild. Trains seeing patterns as chunks; adapts the number of squares. */
export function MemorySnapshot({ size, start, onDone }: { size: number; start: number; onDone: (r: { level: number; best: number; rounds: { k: number; acc: number }[] }) => void }) {
  const [k, setK] = useState(start);
  const [round, setRound] = useState(0);
  const [seed, setSeed] = useState(0);
  const [phase, setPhase] = useState<"ready" | "look" | "rebuild" | "check">("ready");
  const [picked, setPicked] = useState<number[]>([]);
  const [history, setHistory] = useState<{ k: number; acc: number }[]>([]);
  const lit = useMemo(() => sample([...Array(size * size).keys()], k), [k, size, seed]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (phase !== "look") return;
    const t = setTimeout(() => setPhase("rebuild"), LOOK_MS);
    return () => clearTimeout(t);
  }, [phase]);

  const hits = picked.filter((p) => lit.includes(p)).length;
  const falses = picked.length - hits;
  const acc = Math.max(0, (hits - falses) / k);

  function cellClass(i: number) {
    if (phase === "look") return lit.includes(i) ? "bg-accent" : "bg-surface-2";
    if (phase === "rebuild") return picked.includes(i) ? "bg-accent" : "bg-surface-2 hover:bg-accent-soft";
    if (phase === "check") {
      const on = lit.includes(i);
      const p = picked.includes(i);
      return on && p ? "bg-good" : on ? "bg-warn/70" : p ? "bg-danger/50" : "bg-surface-2";
    }
    return "bg-surface-2";
  }

  return (
    <div>
      <Kicker>
        Snapshot · round {round + 1} of {ROUNDS} · {k} squares
      </Kicker>
      <h2 className="mt-2 text-xl font-semibold tracking-tight">
        {phase === "ready" ? "Look for shapes, not squares" : phase === "look" ? "Look…" : phase === "rebuild" ? "Rebuild it" : `${hits} of ${k}`}
      </h2>
      <div className="mt-4 flex justify-center">
        <div className="grid w-full max-w-[20rem] gap-1.5" style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }} role="grid" aria-label="Pattern grid">
          {[...Array(size * size).keys()].map((i) => (
            <button
              key={i}
              type="button"
              role="gridcell"
              aria-label={`Row ${Math.floor(i / size) + 1}, column ${(i % size) + 1}`}
              aria-pressed={phase === "rebuild" ? picked.includes(i) : undefined}
              disabled={phase !== "rebuild"}
              onClick={() => setPicked(picked.includes(i) ? picked.filter((x) => x !== i) : [...picked, i])}
              className={`aspect-square rounded-md transition-colors ${cellClass(i)}`}
            />
          ))}
        </div>
      </div>
      {phase === "ready" && <NextButton onClick={() => setPhase("look")}>Show me ({LOOK_MS / 1000} s)</NextButton>}
      {phase === "rebuild" && (
        <NextButton disabled={picked.length === 0} onClick={() => setPhase("check")}>
          Check ({picked.length} picked)
        </NextButton>
      )}
      {phase === "check" && (
        <>
          <Feedback good={acc >= 0.9}>{acc >= 0.9 ? "Spot on. One more square next time." : acc < 0.6 ? "Tricky. One fewer next time." : "Close. Same size again."}</Feedback>
          <NextButton
            onClick={() => {
              const h = [...history, { k, acc }];
              setHistory(h);
              const nextK = staircase(k, acc, { min: 3, max: Math.floor((size * size) / 2) });
              if (round + 1 >= ROUNDS) {
                onDone({ level: nextK, best: Math.max(...h.filter((x) => x.acc >= 0.9).map((x) => x.k), 0), rounds: h });
                return;
              }
              setRound(round + 1);
              setK(nextK);
              setSeed((s) => s + 1);
              setPicked([]);
              setPhase("ready");
            }}
          >
            {round + 1 >= ROUNDS ? "Finish" : "Next round"}
          </NextButton>
        </>
      )}
    </div>
  );
}
