"use client";
import { useMemo, useState } from "react";
import { sample } from "@/lib/memory";
import { Feedback, Kicker, NextButton } from "../session/bits";

const EXAMPLES = ["Front door", "Shoe rack", "Hallway mirror", "Kitchen sink", "Fridge", "Sofa", "TV", "Stairs", "Bathroom mirror", "Your bed"];

/** Build a memory palace: name spots along a real route, then walk it forwards and backwards. */
export function MemoryPalace({ size, initial, onDone }: { size: number; initial: string[]; onDone: (r: { loci: string[]; score: number }) => void }) {
  const [loci, setLoci] = useState<string[]>(() => Array.from({ length: size }, (_, i) => initial[i] ?? ""));
  const [phase, setPhase] = useState<"name" | "forward" | "backward" | "done">("name");
  const [picked, setPicked] = useState<number[]>([]);
  const [errors, setErrors] = useState(0);
  const filled = loci.every((l) => l.trim().length > 0);
  const unique = new Set(loci.map((l) => l.trim().toLowerCase())).size === loci.length;
  const shuffled = useMemo(() => sample(loci.map((l, i) => ({ l, i })), loci.length), [loci, phase]); // eslint-disable-line react-hooks/exhaustive-deps

  if (phase === "name") {
    return (
      <div>
        <Kicker>Your palace</Kicker>
        <h2 className="mt-2 text-xl font-semibold tracking-tight">Name {size} spots along a walk through your home</h2>
        <p className="mt-1 text-muted">In the order you&apos;d naturally pass them. Pick distinct things you can picture clearly: a door, a sink, a chair.</p>
        <ol className="mt-4 flex flex-col gap-2">
          {loci.map((l, i) => (
            <li key={i} className="flex items-center gap-3">
              <span className="w-6 text-right text-sm text-muted">{i + 1}</span>
              <input
                value={l}
                maxLength={40}
                aria-label={`Spot ${i + 1}`}
                placeholder={EXAMPLES[i % EXAMPLES.length]}
                onChange={(e) => setLoci(loci.map((x, j) => (j === i ? e.target.value : x)))}
                className="min-h-11 flex-1 rounded-lg border border-border bg-surface px-3 text-base"
              />
            </li>
          ))}
        </ol>
        {!unique && filled && <p className="mt-2 text-sm text-warn">Each spot needs to be different.</p>}
        <NextButton disabled={!filled || !unique} onClick={() => setPhase("forward")}>
          Walk it from memory
        </NextButton>
      </div>
    );
  }

  const order = phase === "backward" ? [...loci.keys()].reverse() : [...loci.keys()];
  const expected = order[picked.length];

  function tap(i: number) {
    if (i !== expected) {
      setErrors((e) => e + 1);
      return;
    }
    const next = [...picked, i];
    setPicked(next);
    if (next.length === loci.length) {
      setPhase(phase === "forward" ? "backward" : "done");
      setPicked([]);
    }
  }

  if (phase === "done") {
    const total = loci.length * 2;
    const score = Math.max(0, (total - errors) / total);
    return (
      <div>
        <Kicker>Your palace</Kicker>
        <h2 className="mt-2 text-xl font-semibold tracking-tight">Palace built</h2>
        <Feedback good={errors <= 1}>
          {errors === 0 ? "Forwards and backwards without a slip. That route is solid." : `${errors} slip${errors > 1 ? "s" : ""}. Walk it once more in your head before the next stage.`}
        </Feedback>
        <p className="mt-4 text-sm text-muted">Saved. The word and number drills will use these spots.</p>
        <NextButton onClick={() => onDone({ loci: loci.map((l) => l.trim()), score })} />
      </div>
    );
  }

  return (
    <div>
      <Kicker>Walk it {phase === "forward" ? "forwards" : "backwards"}</Kicker>
      <h2 className="mt-2 text-xl font-semibold tracking-tight">
        {phase === "forward" ? "Tap the spots in walking order" : "Now in reverse, from the last spot back to the first"}
      </h2>
      <p className="mt-1 text-sm text-muted" aria-live="polite">
        {picked.length} of {loci.length}
        {errors > 0 ? ` · ${errors} slip${errors > 1 ? "s" : ""}` : ""}
      </p>
      <div className="mt-4 grid grid-cols-2 gap-2">
        {shuffled.map(({ l, i }) => (
          <button
            key={i}
            type="button"
            disabled={picked.includes(i)}
            onClick={() => tap(i)}
            className="min-h-12 rounded-xl border border-border bg-surface px-3 text-left disabled:border-good disabled:bg-good-soft disabled:opacity-70"
          >
            {l}
          </button>
        ))}
      </div>
    </div>
  );
}
