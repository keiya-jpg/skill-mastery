"use client";
import { useMemo, useState } from "react";
import type { Activity } from "@/lib/skill/schema";
import { Feedback, Kicker, NextButton } from "./bits";
import type { ActivityProps } from "./types";

type A = Extract<Activity, { type: "order" }>;

function shuffle<T>(xs: T[]): T[] {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  // Never start already in order.
  return a.every((x, i) => x === xs[i]) && a.length > 1 ? [...a.slice(1), a[0]!] : a;
}

/** Tap the steps in order. Works the same with a thumb or a mouse. */
export function Order({ activity: a, onDone }: ActivityProps<A>) {
  const pool = useMemo(() => shuffle(a.steps.map((s, i) => ({ s, i }))), [a.steps]);
  const [chosen, setChosen] = useState<number[]>([]);
  const [checked, setChecked] = useState(false);
  const complete = chosen.length === a.steps.length;
  const correct = chosen.filter((v, i) => v === i).length;

  return (
    <div>
      <Kicker>Put it in order</Kicker>
      <h2 className="mt-2 text-xl font-semibold tracking-tight">{a.prompt}</h2>
      <ol className="mt-4 flex min-h-12 flex-col gap-2">
        {chosen.map((v, pos) => (
          <li key={v}>
            <button
              type="button"
              disabled={checked}
              onClick={() => setChosen(chosen.filter((x) => x !== v))}
              className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left ${
                checked ? (v === pos ? "border-good bg-good-soft" : "border-warn bg-warn-soft") : "border-accent bg-accent-soft"
              }`}
            >
              <span className="text-sm text-muted">{pos + 1}</span>
              <span className="flex-1">{a.steps[v]}</span>
            </button>
          </li>
        ))}
      </ol>
      {!complete && (
        <>
          <p className="mt-4 text-sm text-muted">{chosen.length === 0 ? "Tap the first step." : "Tap the next one. Tap a chosen step to undo it."}</p>
          <div className="mt-2 flex flex-col gap-2">
            {pool
              .filter((p) => !chosen.includes(p.i))
              .map((p) => (
                <button key={p.i} type="button" onClick={() => setChosen([...chosen, p.i])} className="min-h-12 rounded-xl border border-border bg-surface px-4 py-3 text-left hover:border-accent">
                  {p.s}
                </button>
              ))}
          </div>
        </>
      )}
      {complete && !checked && <NextButton onClick={() => setChecked(true)}>Check</NextButton>}
      {checked && (
        <>
          <Feedback good={correct === a.steps.length}>
            {correct === a.steps.length ? "All in the right order." : (
              <>
                {correct} of {a.steps.length} in place. The order is:
                <ol className="mt-2 list-decimal pl-5">
                  {a.steps.map((s) => <li key={s}>{s}</li>)}
                </ol>
              </>
            )}
          </Feedback>
          <NextButton onClick={() => onDone({ attempts: a.steps.length, successes: correct, score: correct / a.steps.length })} />
        </>
      )}
    </div>
  );
}
