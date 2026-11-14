"use client";
import { useState } from "react";
import type { Activity } from "@/lib/skill/schema";
import { Kicker, NextButton } from "./bits";
import type { ActivityProps } from "./types";

type A = Extract<Activity, { type: "recall" }>;

/** Answer from memory first; then compare and judge honestly. */
export function Recall({ activity: a, onDone }: ActivityProps<A>) {
  const [text, setText] = useState("");
  const [shown, setShown] = useState(false);
  return (
    <div>
      <Kicker>From memory</Kicker>
      <h2 className="mt-2 text-xl font-semibold tracking-tight">{a.prompt}</h2>
      <label className="sr-only" htmlFor={`recall-${a.id}`}>Your answer</label>
      <textarea
        id={`recall-${a.id}`}
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={shown}
        rows={3}
        placeholder="Type it, or just say it in your head"
        className="mt-4 w-full rounded-xl border border-border bg-surface px-4 py-3 text-base"
      />
      {!shown ? (
        <div className="mt-4 flex flex-wrap gap-3">
          <NextButton onClick={() => setShown(true)}>Show the answer</NextButton>
        </div>
      ) : (
        <div className="rise">
          <div className="mt-4 rounded-xl bg-surface-2 px-4 py-3">
            <p className="text-sm text-muted">Answer</p>
            <p className="mt-1 text-[17px]">{a.answer}</p>
            {a.tip && <p className="mt-2 text-sm text-muted">💡 {a.tip}</p>}
          </div>
          <p className="mt-5 text-sm font-medium">How did you do?</p>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {(
              [
                ["Not yet", 0],
                ["Partly", 0.5],
                ["Got it", 1],
              ] as const
            ).map(([label, score]) => (
              <button key={label} type="button" onClick={() => onDone({ score, data: { typed: text.slice(0, 300) } })} className="min-h-12 rounded-xl border border-border bg-surface hover:border-accent">
                {label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
